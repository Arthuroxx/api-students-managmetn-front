import { HttpErrorResponse } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const isLoginRequest = request.url.endsWith('/auth/login');
  const authorizedRequest =
    token && !isLoginRequest
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isLoginRequest) {
        auth.logout();

        const returnUrl = router.url;
        const isSafeReturnUrl = returnUrl.startsWith('/') && !returnUrl.startsWith('/login');

        void router.navigate(['/login'], {
          queryParams: isSafeReturnUrl && returnUrl !== '/' ? { returnUrl } : {},
        });
      }

      return throwError(() => error);
    }),
  );
};
