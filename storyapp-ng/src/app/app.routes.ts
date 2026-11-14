import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './auth/auth-guard';
import { LoginPage } from './auth/login-page';
import { RegisterPage } from './auth/register-page';

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'register', component: RegisterPage, canActivate: [guestGuard] },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadChildren: () => import('./story/story.routes').then((m) => m.storyRoutes),
  },
  { path: '**', redirectTo: '' },
];
