import { inject, Injectable } from '@angular/core';

import { LocalStorage } from '../storage/local-storage';

/** localStorage keys of the access and refresh token. */
export const TOKEN_STORAGE_KEYS = {
  accessToken: 'storyapp_access_token',
  refreshToken: 'storyapp_refresh_token',
} as const;

/** Keeps the access and refresh token in localStorage. */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly storage = inject(LocalStorage);

  getAccessToken(): string | null {
    return this.storage.get(TOKEN_STORAGE_KEYS.accessToken);
  }

  getRefreshToken(): string | null {
    return this.storage.get(TOKEN_STORAGE_KEYS.refreshToken);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.storage.set(TOKEN_STORAGE_KEYS.accessToken, accessToken);
    this.storage.set(TOKEN_STORAGE_KEYS.refreshToken, refreshToken);
  }

  clearTokens(): void {
    this.storage.remove(TOKEN_STORAGE_KEYS.accessToken);
    this.storage.remove(TOKEN_STORAGE_KEYS.refreshToken);
  }

  hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }
}
