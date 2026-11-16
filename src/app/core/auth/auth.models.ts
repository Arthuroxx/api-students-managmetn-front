export const USER_ROLES = ['ADMIN', 'USER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const STUDENT_VIEW_ROLES = ['ADMIN', 'USER'] as const satisfies readonly UserRole[];

export const STUDENT_MANAGE_ROLES = ['ADMIN'] as const satisfies readonly UserRole[];

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface LoginResponse {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresIn: number;
  readonly role: UserRole;
}

export interface AuthSession {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresAt: number;
  readonly role: UserRole;
  readonly email: string;
}

export interface AuthenticatedUser {
  readonly email: string;
  readonly role: UserRole;
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}
