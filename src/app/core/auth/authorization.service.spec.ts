import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { AuthenticatedUser } from './auth.models';
import { AuthService } from './auth.service';
import { AuthorizationService } from './authorization.service';

interface Harness {
  readonly service: AuthorizationService;
  readonly user: ReturnType<typeof signal<AuthenticatedUser | null>>;
  readonly authenticated: ReturnType<typeof signal<boolean>>;
}

function createHarness(initialUser: AuthenticatedUser | null): Harness {
  const user = signal<AuthenticatedUser | null>(initialUser);
  const authenticated = signal(initialUser !== null);

  TestBed.configureTestingModule({
    providers: [{ provide: AuthService, useValue: { user, isAuthenticated: authenticated } }],
  });

  return { service: TestBed.inject(AuthorizationService), user, authenticated };
}

describe('AuthorizationService', () => {
  it('should deny every permission without an authenticated session', () => {
    const { service } = createHarness(null);

    expect(service.role()).toBeNull();
    expect(service.isAdmin()).toBe(false);
    expect(service.canViewStudents()).toBe(false);
    expect(service.canManageStudents()).toBe(false);
    expect(service.hasRole(['ADMIN', 'USER'])).toBe(false);
  });

  it('should grant administration and management permissions to ADMIN', () => {
    const { service } = createHarness({ email: 'admin@example.com', role: 'ADMIN' });

    expect(service.role()).toBe('ADMIN');
    expect(service.isAdmin()).toBe(true);
    expect(service.canViewStudents()).toBe(true);
    expect(service.canManageStudents()).toBe(true);
    expect(service.hasRole(['ADMIN'])).toBe(true);
    expect(service.hasRole(['USER'])).toBe(false);
  });

  it('should grant read-only student permissions to USER', () => {
    const { service } = createHarness({ email: 'reader@example.com', role: 'USER' });

    expect(service.role()).toBe('USER');
    expect(service.isAdmin()).toBe(false);
    expect(service.canViewStudents()).toBe(true);
    expect(service.canManageStudents()).toBe(false);
    expect(service.hasRole(['ADMIN', 'USER'])).toBe(true);
    expect(service.hasRole(['ADMIN'])).toBe(false);
  });

  it('should deny permissions when the session expires', () => {
    const { service, authenticated } = createHarness({
      email: 'admin@example.com',
      role: 'ADMIN',
    });

    authenticated.set(false);

    expect(service.role()).toBe('ADMIN');
    expect(service.isAdmin()).toBe(false);
    expect(service.canViewStudents()).toBe(false);
    expect(service.canManageStudents()).toBe(false);
  });

  it('should react to session changes', () => {
    const { service, user } = createHarness({ email: 'reader@example.com', role: 'USER' });

    expect(service.canManageStudents()).toBe(false);

    user.set({ email: 'admin@example.com', role: 'ADMIN' });

    expect(service.isAdmin()).toBe(true);
    expect(service.canManageStudents()).toBe(true);

    user.set(null);

    expect(service.role()).toBeNull();
    expect(service.isAdmin()).toBe(false);
  });
});
