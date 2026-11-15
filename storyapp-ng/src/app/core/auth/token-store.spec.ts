import { TestBed } from '@angular/core/testing';

import { TOKEN_STORAGE_KEYS, TokenStore } from './token-store';

describe('TokenStore', () => {
  let store: TokenStore;

  beforeEach(() => {
    localStorage.clear();
    store = TestBed.inject(TokenStore);
  });

  it('stores both tokens under the storyapp-web keys', () => {
    store.setTokens('access', 'refresh');
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken)).toBe('access');
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.refreshToken)).toBe('refresh');
    expect(store.getAccessToken()).toBe('access');
    expect(store.getRefreshToken()).toBe('refresh');
  });

  it('reports tokens only when both are present', () => {
    expect(store.hasTokens()).toBe(false);
    localStorage.setItem(TOKEN_STORAGE_KEYS.accessToken, 'access');
    expect(store.hasTokens()).toBe(false);
    localStorage.setItem(TOKEN_STORAGE_KEYS.refreshToken, 'refresh');
    expect(store.hasTokens()).toBe(true);
  });

  it('clears both tokens', () => {
    store.setTokens('access', 'refresh');
    store.clearTokens();
    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBeNull();
    expect(store.hasTokens()).toBe(false);
  });
});
