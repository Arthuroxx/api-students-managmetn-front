import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
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
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
