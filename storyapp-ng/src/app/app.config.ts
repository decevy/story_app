import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withAutoCleanupInjectors } from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthService } from './auth/auth';
import { APP_CONFIG } from './core/config/app-config';
import { authInterceptor } from './core/http/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: APP_CONFIG, useValue: environment },
    provideHttpClient(withInterceptors([authInterceptor])),
    // Destroys the story route injector (StoryStore) once the route is left, like
    // unmounting StoryProvider in the React app.
    provideRouter(routes, withAutoCleanupInjectors()),
    provideAppInitializer(() => inject(AuthService).initialize()),
  ],
};
