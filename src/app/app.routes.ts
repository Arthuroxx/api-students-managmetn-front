import type { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

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
        loadComponent: () =>
          import('./features/students/students').then((module) => module.Students),
      },
      {
        path: 'students/new',
        title: 'Add student',
        loadComponent: () =>
          import('./features/students/student-editor/student-editor').then(
            (module) => module.StudentEditor,
          ),
      },
      {
        path: 'students/:id/edit',
        title: 'Edit student',
        loadComponent: () =>
          import('./features/students/student-editor/student-editor').then(
            (module) => module.StudentEditor,
          ),
      },
      {
        path: 'students/:id',
        title: 'Student details',
        loadComponent: () =>
          import('./features/students/student-detail/student-detail').then(
            (module) => module.StudentDetail,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
