import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';
import { buildApiUrl } from '../http/api-url';
import type {
  AuthSession,
  AuthenticatedUser,
  LoginCredentials,
  LoginResponse,
} from './auth.models';
import { isUserRole } from './auth.models';
import type { DecodedJwtPayload } from './jwt';
import { decodeJwtPayload } from './jwt';

export const AUTH_STORAGE_KEY = 'student-management.session';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly document = inject(DOCUMENT);
  private readonly sessionState = signal<AuthSession | null>(this.readStoredSession());

  readonly session = this.sessionState.asReadonly();
  readonly user = computed<AuthenticatedUser | null>(() => {
    const session = this.sessionState();

    return session ? { email: session.email, role: session.role } : null;
  });
  readonly isAuthenticated = computed(() => {
    const session = this.sessionState();

    return session !== null && session.expiresAt > Date.now();
  });
  readonly token = computed(() => {
    if (!this.isAuthenticated()) {
      return null;
    }

    return this.sessionState()?.accessToken ?? null;
  });

  login(credentials: LoginCredentials): Observable<void> {
    return this.http
      .post<LoginResponse>(buildApiUrl(this.baseUrl, 'auth/login'), {
        email: credentials.email.trim(),
        password: credentials.password,
      })
      .pipe(
        tap((response) => this.startSession(response)),
        map(() => undefined),
      );
  }

  logout(): void {
    this.sessionState.set(null);
    this.clearStoredSession();
  }

  private startSession(response: LoginResponse): void {
    const payload = decodeJwtPayload(response.accessToken);
    const role = isUserRole(response.role)
      ? response.role
      : isUserRole(payload?.role)
        ? payload.role
        : null;
    const email = payload?.email?.trim();

    if (!payload || !role || !email) {
      throw new Error('The API returned an invalid session.');
    }

    const expiresAt = this.resolveExpiry(response.expiresIn, payload);

    if (expiresAt === null) {
      throw new Error('The API returned a session without an expiry.');
    }

    const session: AuthSession = {
      accessToken: response.accessToken,
      tokenType: 'Bearer',
      expiresAt,
      role,
      email,
    };

    this.sessionState.set(session);
    this.persistSession(session);
  }

  private resolveExpiry(expiresIn: number, payload: DecodedJwtPayload): number | null {
    if (Number.isFinite(expiresIn) && expiresIn > 0) {
      return Date.now() + expiresIn * 1000;
    }

    if (typeof payload.exp === 'number' && payload.exp > 0) {
      return payload.exp * 1000;
    }

    return null;
  }

  private readStoredSession(): AuthSession | null {
    try {
      const raw = this.document.defaultView?.localStorage.getItem(AUTH_STORAGE_KEY);

      if (!raw) {
        return null;
      }

      const session = parseSession(JSON.parse(raw));

      if (!session || session.expiresAt <= Date.now()) {
        this.clearStoredSession();
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    try {
      this.document.defaultView?.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage can be unavailable in private browsing contexts; the in-memory session still works.
    }
  }

  private clearStoredSession(): void {
    try {
      this.document.defaultView?.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Nothing to clean up when storage is unavailable.
    }
  }
}

function parseSession(value: unknown): AuthSession | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const { accessToken, tokenType, expiresAt, role, email } = candidate;

  if (
    typeof accessToken !== 'string' ||
    accessToken.length === 0 ||
    tokenType !== 'Bearer' ||
    typeof expiresAt !== 'number' ||
    !Number.isFinite(expiresAt) ||
    !isUserRole(role) ||
    typeof email !== 'string' ||
    email.length === 0
  ) {
    return null;
  }

  return { accessToken, tokenType, expiresAt, role, email };
}
