import { AppConfig } from './app-config';

/** Builds `${apiUrl}/api${path}`; `path` starts with a slash. */
export function apiUrl(config: AppConfig, path: string): string {
  return `${config.apiUrl}/api${path}`;
}

/** True when `url` targets this app's REST API. */
export function isApiUrl(config: AppConfig, url: string): boolean {
  return url.startsWith(`${config.apiUrl}/api/`);
}
