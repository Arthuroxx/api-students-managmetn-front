import { signal } from '@angular/core';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import type { UserRole } from './auth.models';
import { AuthService } from './auth.service';
import { AuthorizationService } from './authorization.service';
import { readRequiredRoles, roleGuard } from './role.guard';

function createRoute(data: Record<string, unknown>): ActivatedRouteSnapshot {
  return { data } as ActivatedRouteSnapshot;
}

function createState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

function runGuard(data: Record<string, unknown>, url: string): boolean | UrlTree {
  const route = createRoute(data);
  const state = createState(url);

  return TestBed.runInInjectionContext(() => roleGuard(route, state)) as boolean | UrlTree;
}

describe('readRequiredRoles', () => {
  it('should return null when the route declares no roles', () => {
    expect(readRequiredRoles({})).toBeNull();
  });

  it('should keep valid roles', () => {
    expect(readRequiredRoles({ roles: ['ADMIN', 'USER'] })).toEqual(['ADMIN', 'USER']);
  });

  it('should deny malformed declarations by returning an empty list', () => {
    expect(readRequiredRoles({ roles: 'ADMIN' })).toEqual([]);
    expect(readRequiredRoles({ roles: ['ADMIN', 'GUEST'] })).toEqual([]);
    expect(readRequiredRoles({ roles: [42] })).toEqual([]);
  });
});

describe('roleGuard', () => {
  let authenticated: ReturnType<typeof signal<boolean>>;
  let hasRole: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(() => {
    authenticated = signal(true);
    hasRole = vi.fn().mockReturnValue(true);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: authenticated } },
        { provide: AuthorizationService, useValue: { hasRole } },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow authenticated users when the route has no role restriction', () => {
    expect(runGuard({}, '/')).toBe(true);
  });

  it('should allow authenticated users with a required role', () => {
    const result = runGuard({ roles: ['ADMIN'] }, '/students/new');

    expect(result).toBe(true);
    expect(hasRole).toHaveBeenCalledWith(['ADMIN']);
  });

  it('should redirect unauthenticated users to the login page', () => {
    authenticated.set(false);

    const result = runGuard({ roles: ['ADMIN'] }, '/students/new');

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fstudents%2Fnew');
    expect(hasRole).not.toHaveBeenCalled();
  });

  it('should send authenticated users without permission to the 403 page', () => {
    hasRole.mockReturnValue(false);

    const result = runGuard({ roles: ['ADMIN'] }, '/students/student-1/edit');

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/forbidden?from=%2Fstudents%2Fstudent-1%2Fedit',
    );
  });

  it('should deny access to a malformed role declaration', () => {
    hasRole.mockReturnValue(false);

    const result = runGuard({ roles: [] }, '/students/new');

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/forbidden?from=%2Fstudents%2Fnew');
  });

  it('should call the authorization service with the declared roles', () => {
    const roles: readonly UserRole[] = ['ADMIN', 'USER'];

    runGuard({ roles }, '/students');

    expect(hasRole).toHaveBeenCalledWith(roles);
  });
});
