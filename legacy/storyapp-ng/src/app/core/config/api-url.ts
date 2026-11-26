import { inject } from '@angular/core';

import { APP_CONFIG, type AppConfig } from './app-config';

/** Builds `${apiUrl}/api${path}`; `path` starts with a slash. */
export function apiUrl(config: AppConfig, path: string): string {
  return `${config.apiUrl}/api${path}`;
}

/** True when `url` targets this app's REST API. */
export function isApiUrl(config: AppConfig, url: string): boolean {
  return url.startsWith(`${config.apiUrl}/api/`);
}

/**
 * Returns a function that turns an API path into a full URL, e.g. `url('/stories')`. Call it in
 * an injection context (a field initializer).
 */
export function injectApiUrl(): (path: string) => string {
  const config = inject(APP_CONFIG);
  return (path) => apiUrl(config, path);
}
