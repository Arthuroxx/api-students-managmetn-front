import { signal } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;
  let router: Router;
  let token: ReturnType<typeof signal<string | null>>;
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    token = signal<string | null>('signed-token');
    logout = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { token, logout },
        },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
  });

  it('should attach the bearer token to protected requests', () => {
    httpClient.get('/students').subscribe();

    const request = http.expectOne('/students');

    expect(request.request.headers.get('Authorization')).toBe('Bearer signed-token');

    request.flush({});
  });

  it('should leave the login request unauthenticated', () => {
    httpClient.post('/auth/login', {}).subscribe();

    const request = http.expectOne('/auth/login');

    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush({});
  });

  it('should log out and redirect when a protected request returns 401', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    httpClient.get('/students').subscribe({ error: () => undefined });

    http
      .expectOne('/students')
      .flush({ statusCode: 401 }, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: {} });
  });

  it('should not log out when the login request returns 401', () => {
    httpClient.post('/auth/login', {}).subscribe({ error: () => undefined });

    http
      .expectOne('/auth/login')
      .flush({ statusCode: 401 }, { status: 401, statusText: 'Unauthorized' });

    expect(logout).not.toHaveBeenCalled();
  });
});
