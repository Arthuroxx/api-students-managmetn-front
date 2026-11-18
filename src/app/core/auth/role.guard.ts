import { inject } from '@angular/core';
import type { CanActivateFn, Data } from '@angular/router';
import { Router } from '@angular/router';
import type { UserRole } from './auth.models';
import { isUserRole } from './auth.models';
import { AuthService } from './auth.service';
import { AuthorizationService } from './authorization.service';

export const ROLES_DATA_KEY = 'roles';

/**
 * Reads the roles required by a route. Returns `null` when the route declares
 * no role restriction, and an empty list when the declaration is invalid so
 * that a misconfigured route denies access instead of opening it.
 */
export function readRequiredRoles(data: Data): readonly UserRole[] | null {
  const value: unknown = data[ROLES_DATA_KEY];

  if (value === undefined) {
    return null;
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.every(isUserRole) ? value : [];
}

/**
 * Protects routes by role while keeping the two failure modes distinct:
 * unauthenticated visitors are sent to the login page, while authenticated
 * users without the required role are sent to the 403 page.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const authorization = inject(AuthorizationService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const requiredRoles = readRequiredRoles(route.data);

  if (requiredRoles === null || authorization.hasRole(requiredRoles)) {
    return true;
  }

  return router.createUrlTree(['/forbidden'], { queryParams: { from: state.url } });
};
