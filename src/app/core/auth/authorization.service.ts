import { computed, inject, Service } from '@angular/core';
import type { UserRole } from './auth.models';
import { STUDENT_MANAGE_ROLES, STUDENT_VIEW_ROLES } from './auth.models';
import { AuthService } from './auth.service';

/**
 * Derives authorization decisions from the existing authenticated session.
 *
 * The role is never stored separately: the API issues it with the access token
 * and the backend re-validates it on every protected request.
 */
@Service()
export class AuthorizationService {
  private readonly auth = inject(AuthService);

  readonly role = computed<UserRole | null>(() => this.auth.user()?.role ?? null);
  readonly isAdmin = computed(() => this.hasRole(STUDENT_MANAGE_ROLES));
  readonly canViewStudents = computed(() => this.hasRole(STUDENT_VIEW_ROLES));
  readonly canManageStudents = computed(() => this.hasRole(STUDENT_MANAGE_ROLES));

  hasRole(roles: readonly UserRole[]): boolean {
    const role = this.role();

    return this.auth.isAuthenticated() && role !== null && roles.includes(role);
  }
}
