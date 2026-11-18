import { signal } from '@angular/core';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

const route = {} as ActivatedRouteSnapshot;

function createRouterState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('authGuard', () => {
  let authenticated: ReturnType<typeof signal<boolean>>;
  let router: Router;

  beforeEach(() => {
    authenticated = signal(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: authenticated } },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow authenticated users', () => {
    authenticated.set(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, createRouterState('/students')),
    );

    expect(result).toBe(true);
  });

  it('should redirect guests to login with a return URL', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, createRouterState('/students')),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fstudents');
  });
});

describe('guestGuard', () => {
  let authenticated: ReturnType<typeof signal<boolean>>;
  let router: Router;

  beforeEach(() => {
    authenticated = signal(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: authenticated } },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow guests to reach the login page', () => {
    const result = TestBed.runInInjectionContext(() =>
      guestGuard(route, createRouterState('/login')),
    );

    expect(result).toBe(true);
  });

  it('should redirect authenticated users to the overview', () => {
    authenticated.set(true);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard(route, createRouterState('/login')),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
