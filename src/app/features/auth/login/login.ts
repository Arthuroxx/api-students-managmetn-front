import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, maxLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { LoginCredentials } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { BrandMark } from '../../../shared/brand/brand-mark';

@Component({
  selector: 'sms-login',
  imports: [BrandMark, FormField, FormRoot],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly model = signal<LoginCredentials>({ email: '', password: '' });
  protected readonly showPassword = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Enter your email address.' });
      email(path.email, { message: 'Enter a valid email address.' });
      maxLength(path.email, 255, { message: 'Email must be 255 characters or fewer.' });

      required(path.password, { message: 'Enter your password.' });
      maxLength(path.password, 128, { message: 'Password must be 128 characters or fewer.' });
    },
    {
      submission: {
        action: async (field) => {
          this.formError.set(null);

          try {
            await firstValueFrom(this.auth.login(field().value()));
            await this.router.navigateByUrl(this.returnUrl());
          } catch (error) {
            this.formError.set(this.describeError(error));
          }

          return undefined;
        },
      },
    },
  );

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected showFieldError(field: 'email' | 'password'): boolean {
    const state = this.loginForm[field]();

    return state.touched() && state.invalid();
  }

  protected fieldErrorMessage(field: 'email' | 'password'): string | null {
    return this.loginForm[field]().errors()[0]?.message ?? null;
  }

  private returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');

    if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
      return '/';
    }

    return value;
  }

  private describeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Something went wrong. Please try again.';
    }

    switch (error.status) {
      case 401:
        return 'Invalid email or password.';
      case 429:
        return 'Too many sign-in attempts. Wait a moment and try again.';
      case 0:
        return 'The API is unreachable. Check that it is running and try again.';
      default:
        return this.apiMessage(error.error) ?? 'Sign-in failed. Please try again.';
    }
  }

  private apiMessage(body: unknown): string | null {
    if (typeof body !== 'object' || body === null) {
      return null;
    }

    const message = (body as Record<string, unknown>)['message'];

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message) && typeof message[0] === 'string') {
      return message[0];
    }

    return null;
  }
}
