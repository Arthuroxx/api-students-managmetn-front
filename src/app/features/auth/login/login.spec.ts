import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Login } from './login';

@Component({ template: '' })
class StubPage {}

function setInput(element: HTMLElement, selector: string, value: string): void {
  const input = element.querySelector<HTMLInputElement>(selector);

  if (!input) {
    throw new Error(`Input not found: ${selector}`);
  }

  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function submitForm(element: HTMLElement): void {
  element
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Login', () => {
  let auth: { login: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    auth = { login: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([
          { path: '', component: StubPage },
          { path: 'students', component: StubPage },
          { path: 'login', component: Login },
        ]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    await router.navigateByUrl('/login');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render the sign-in form', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Sign in to your workspace');
    expect(element.querySelector('#login-email')).not.toBeNull();
    expect(element.querySelector('#login-password')).not.toBeNull();
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Sign in');
  });

  it('should show validation messages and skip the API for an empty form', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    submitForm(element);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('#login-email-error')?.textContent).toContain(
      'Enter your email address.',
    );
    expect(element.querySelector('#login-password-error')?.textContent).toContain(
      'Enter your password.',
    );
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('should submit credentials and return to the requested route', async () => {
    await router.navigateByUrl('/login?returnUrl=/students');

    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    auth.login.mockReturnValue(of(undefined));

    setInput(element, '#login-email', 'admin@example.com');
    setInput(element, '#login-password', 'secret');

    submitForm(element);
    await fixture.whenStable();

    expect(auth.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secret',
    });
    await vi.waitFor(() => expect(router.url).toBe('/students'));
  });

  it('should show the API error for invalid credentials', async () => {
    auth.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { statusCode: 401, message: 'Invalid email or password', error: 'Unauthorized' },
          }),
      ),
    );

    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    setInput(element, '#login-email', 'admin@example.com');
    setInput(element, '#login-password', 'wrong');
    submitForm(element);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Invalid email or password.',
    );
  });

  it('should explain when the API is rate limiting sign-in attempts', async () => {
    auth.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            error: { statusCode: 429, message: 'ThrottlerException: Too Many Requests' },
          }),
      ),
    );

    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    setInput(element, '#login-email', 'admin@example.com');
    setInput(element, '#login-password', 'secret');
    submitForm(element);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Too many sign-in attempts',
    );
  });

  it('should toggle password visibility', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#login-password');
    const reveal = element.querySelector<HTMLButtonElement>('.login__reveal');

    expect(input?.type).toBe('password');

    reveal?.click();
    fixture.detectChanges();

    expect(input?.type).toBe('text');
    expect(reveal?.getAttribute('aria-label')).toBe('Hide password');
  });
});
