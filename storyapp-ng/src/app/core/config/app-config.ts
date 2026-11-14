import { InjectionToken } from '@angular/core';

/** Replaces VITE_API_URL / VITE_HUB_URL from storyapp-web. */
export interface AppConfig {
  /** Origin of the REST API; requests go to `${apiUrl}/api/...`. Empty = same origin (dev proxy). */
  apiUrl: string;
  /** SignalR hub URL. */
  hubUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
