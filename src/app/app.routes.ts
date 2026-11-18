import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Student Management',
    loadComponent: () =>
      import('./features/welcome/welcome').then((component) => component.Welcome),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
