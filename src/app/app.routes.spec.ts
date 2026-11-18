import type { Route } from '@angular/router';
import { routes } from './app.routes';
import { authGuard } from './core/auth/auth.guard';
import { STUDENT_MANAGE_ROLES, STUDENT_VIEW_ROLES } from './core/auth/auth.models';
import { roleGuard } from './core/auth/role.guard';

function findRoute(path: string): Route | undefined {
  const shell = routes.find((route) => route.path === '');

  return shell?.children?.find((route) => route.path === path);
}

describe('application routes', () => {
  it('should require authentication for the application shell', () => {
    const shell = routes.find((route) => route.path === '');

    expect(shell?.canActivate).toContain(authGuard);
  });

  it('should protect the student directory and detail for both roles', () => {
    for (const path of ['students', 'students/:id']) {
      const route = findRoute(path);

      expect(route?.canActivate).toContain(roleGuard);
      expect(route?.data?.['roles']).toEqual(STUDENT_VIEW_ROLES);
    }
  });

  it('should restrict student management routes to administrators', () => {
    for (const path of ['students/new', 'students/:id/edit']) {
      const route = findRoute(path);

      expect(route?.canActivate).toContain(roleGuard);
      expect(route?.data?.['roles']).toEqual(STUDENT_MANAGE_ROLES);
    }
  });

  it('should expose an authenticated forbidden page', () => {
    const route = findRoute('forbidden');

    expect(route).toBeDefined();
    expect(route?.canActivate).toBeUndefined();
  });

  it('should keep the login route available to guests only', () => {
    const login = routes.find((route) => route.path === 'login');

    expect(login?.canActivate).toHaveLength(1);
    expect(login?.canActivate).not.toContain(roleGuard);
  });
});
