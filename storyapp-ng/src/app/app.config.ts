import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withAutoCleanupInjectors,
  withComponentInputBinding,
} from '@angular/router';
import { authInterceptor } from '@core/auth/auth-interceptor';
import { AuthService } from '@core/auth/auth-service';
import { APP_CONFIG, type AppConfig } from '@core/config/app-config';
import { AppErrorHandler } from '@core/logging/app-error-handler';
import { provideStoryHub } from '@core/story-hub/provide-story-hub';

import { routes } from './app.routes';

/** Providers of the app; `config` is the runtime config loaded by `main.ts`. */
export function appConfig(config: AppConfig): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      { provide: ErrorHandler, useClass: AppErrorHandler },
      { provide: APP_CONFIG, useValue: config },
      provideHttpClient(withInterceptors([authInterceptor])),
      provideRouter(
        routes,
        // Destroys the story route injector (StoryStore) once the route is left.
        withAutoCleanupInjectors(),
        // Route and query parameters become component inputs (`storyId`, `returnUrl`).
        withComponentInputBinding(),
      ),
      provideAppInitializer(() => inject(AuthService).initialize()),
      provideStoryHub(),
    ],
  };
}
