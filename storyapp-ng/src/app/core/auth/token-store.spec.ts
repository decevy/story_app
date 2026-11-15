import { TestBed } from '@angular/core/testing';

import { STORAGE_KEYS } from '../config/constants';
import { TokenStore } from './token-store';

describe('TokenStore', () => {
  let store: TokenStore;

  beforeEach(() => {
    localStorage.clear();
    store = TestBed.inject(TokenStore);
  });

  it('stores both tokens under the storyapp-web keys', () => {
    store.setTokens('access', 'refresh');
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access');
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh');
    expect(store.getAccessToken()).toBe('access');
    expect(store.getRefreshToken()).toBe('refresh');
  });

  it('reports tokens only when both are present', () => {
    expect(store.hasTokens()).toBe(false);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access');
    expect(store.hasTokens()).toBe(false);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh');
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
