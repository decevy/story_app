import type { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/auth/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('@features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@features/auth/register-page/register-page').then((m) => m.RegisterPage),
  },
  {
    // `/` (no story open) and `/stories/:storyId`.
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('@features/story/story.routes').then((m) => m.storyRoutes),
  },
  { path: '**', redirectTo: '' },
];
