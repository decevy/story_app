import { InjectionToken } from '@angular/core';

/**
 * Runtime configuration, read from `config.json` before bootstrap (see `src/main.ts`), so one
 * build can be deployed to every environment. Replaces VITE_API_URL / VITE_HUB_URL.
 */
export interface AppConfig {
  /** Origin of the REST API; requests go to `${apiUrl}/api/...`. Empty = same origin. */
  apiUrl: string;
  /** SignalR hub URL. */
  hubUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

function isAppConfig(value: unknown): value is AppConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<Record<keyof AppConfig, unknown>>;
  return typeof candidate.apiUrl === 'string' && typeof candidate.hubUrl === 'string';
}

/** Fetches and validates `config.json` (served from `public/`, relative to the base href). */
export async function loadAppConfig(
  fetchFn: typeof fetch = fetch,
  url = 'config.json',
): Promise<AppConfig> {
  const response = await fetchFn(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Could not load ${url}: HTTP ${response.status}`);
  }
  const config: unknown = await response.json();
  if (!isAppConfig(config)) {
    throw new Error(`${url} must contain string "apiUrl" and "hubUrl" fields`);
  }
  return { apiUrl: config.apiUrl, hubUrl: config.hubUrl };
}
