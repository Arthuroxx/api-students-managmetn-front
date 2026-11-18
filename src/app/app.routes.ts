import type { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { STUDENT_MANAGE_ROLES, STUDENT_VIEW_ROLES } from './core/auth/auth.models';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((module) => module.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell/app-shell').then((module) => module.AppShell),
    children: [
      {
        path: '',
        title: 'Overview',
        loadComponent: () => import('./features/welcome/welcome').then((module) => module.Welcome),
      },
      {
        path: 'students',
        title: 'Students',
        canActivate: [roleGuard],
        data: { roles: STUDENT_VIEW_ROLES },
        loadComponent: () =>
          import('./features/students/students').then((module) => module.Students),
      },
      {
        path: 'students/new',
        title: 'Add student',
        canActivate: [roleGuard],
        data: { roles: STUDENT_MANAGE_ROLES },
        loadComponent: () =>
          import('./features/students/student-editor/student-editor').then(
            (module) => module.StudentEditor,
          ),
      },
      {
        path: 'students/:id/edit',
        title: 'Edit student',
        canActivate: [roleGuard],
        data: { roles: STUDENT_MANAGE_ROLES },
        loadComponent: () =>
          import('./features/students/student-editor/student-editor').then(
            (module) => module.StudentEditor,
          ),
      },
      {
        path: 'students/:id',
        title: 'Student details',
        canActivate: [roleGuard],
        data: { roles: STUDENT_VIEW_ROLES },
        loadComponent: () =>
          import('./features/students/student-detail/student-detail').then(
            (module) => module.StudentDetail,
          ),
      },
      {
        path: 'forbidden',
        title: 'Access denied',
        loadComponent: () =>
          import('./features/forbidden/forbidden').then((module) => module.Forbidden),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
