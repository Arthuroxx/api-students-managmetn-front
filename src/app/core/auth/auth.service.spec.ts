import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { AuthSession } from './auth.models';
import { AUTH_STORAGE_KEY, AuthService } from './auth.service';
import { API_BASE_URL } from '../config/api-config';

const API_URL = 'http://localhost:3000';

function encodePayload(payload: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  const base64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `header.${base64}.signature`;
}

function createToken(email = 'admin@example.com', role = 'ADMIN'): string {
  return encodePayload({ sub: 'user-1', email, role, exp: 1893456000 });
}

function storeSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function configureTestBed(): void {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: API_URL },
    ],
  });
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  function createService(): AuthService {
    TestBed.resetTestingModule();
    configureTestBed();
    http = TestBed.inject(HttpTestingController);

    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    service = createService();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('should log in, persist the session, and expose the user', () => {
    const next = vi.fn();

    service.login({ email: '  admin@example.com  ', password: 'secret' }).subscribe(next);

    const request = http.expectOne(`${API_URL}/auth/login`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'admin@example.com', password: 'secret' });

    request.flush({
      accessToken: createToken(),
      tokenType: 'Bearer',
      expiresIn: 3600,
      role: 'ADMIN',
    });

    expect(next).toHaveBeenCalledOnce();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toEqual({ email: 'admin@example.com', role: 'ADMIN' });
    expect(service.token()).toBe(createToken());

    const stored = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? 'null') as AuthSession;

    expect(stored.email).toBe('admin@example.com');
    expect(stored.tokenType).toBe('Bearer');
    expect(stored.expiresAt).toBeGreaterThan(Date.now());
  });

  it('should propagate login failures without creating a session', () => {
    const error = vi.fn();

    service.login({ email: 'admin@example.com', password: 'wrong' }).subscribe({ error });

    http
      .expectOne(`${API_URL}/auth/login`)
      .flush(
        { statusCode: 401, message: 'Invalid email or password', error: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(error).toHaveBeenCalledOnce();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('should reject a response with a malformed access token', () => {
    const error = vi.fn();

    service.login({ email: 'admin@example.com', password: 'secret' }).subscribe({ error });

    http.expectOne(`${API_URL}/auth/login`).flush({
      accessToken: 'not-a-jwt',
      tokenType: 'Bearer',
      expiresIn: 3600,
      role: 'ADMIN',
    });

    expect(error).toHaveBeenCalledOnce();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should log out and clear storage', () => {
    storeSession({
      accessToken: createToken(),
      tokenType: 'Bearer',
      expiresAt: Date.now() + 3_600_000,
      role: 'USER',
      email: 'reader@example.com',
    });

    const restored = createService();

    expect(restored.isAuthenticated()).toBe(true);

    restored.logout();

    expect(restored.isAuthenticated()).toBe(false);
    expect(restored.user()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('should restore a valid stored session', () => {
    storeSession({
      accessToken: createToken(),
      tokenType: 'Bearer',
      expiresAt: Date.now() + 3_600_000,
      role: 'USER',
      email: 'reader@example.com',
    });

    const restored = createService();

    expect(restored.isAuthenticated()).toBe(true);
    expect(restored.user()).toEqual({ email: 'reader@example.com', role: 'USER' });
  });

  it('should discard an expired stored session', () => {
    storeSession({
      accessToken: createToken(),
      tokenType: 'Bearer',
      expiresAt: Date.now() - 1_000,
      role: 'USER',
      email: 'reader@example.com',
    });

    const restored = createService();

    expect(restored.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('should ignore malformed stored sessions', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken: 42 }));

    const restored = createService();

    expect(restored.isAuthenticated()).toBe(false);
  });
});
