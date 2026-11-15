import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { APP_CONFIG } from '../config/app-config';
import { LoginResponse } from '../models/auth.types';
import { testUser } from '../../../testing/fixtures';
import { unsignedJwt } from '../../../testing/helpers';
import { AuthService } from './auth';
import { SKIP_AUTH_REFRESH } from './http-context';
import { TokenStore } from './token-store';

const API = 'http://api.test';
const loginResponse: LoginResponse = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user: testUser,
};

/** Unsigned JWT that expires `secondsFromNow` from now. */
function jwtExpiringIn(secondsFromNow: number): string {
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow;
  return unsignedJwt({ exp });
}

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let tokens: TokenStore;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: { apiUrl: API, hubUrl: `${API}/storyHub` } },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStore);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  describe('initialize', () => {
    it('does nothing without stored tokens', async () => {
      await auth.initialize();
      http.expectNone(`${API}/api/auth/me`);
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('restores the user from /auth/me', async () => {
      tokens.setTokens('access', 'refresh');
      const done = auth.initialize();
      http
        .expectOne(`${API}/api/auth/me`)
        .flush({ userId: 7, username: 'bobby', email: 'bobby@test.com' });
      await done;

      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.user()).toMatchObject({
        id: 7,
        username: 'bobby',
        email: 'bobby@test.com',
        isOnline: true,
      });
    });

    it('clears invalid tokens', async () => {
      tokens.setTokens('access', 'refresh');
      const done = auth.initialize();
      http.expectOne(`${API}/api/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
      await done;

      expect(auth.isAuthenticated()).toBe(false);
      expect(tokens.hasTokens()).toBe(false);
    });
  });

  describe('login and register', () => {
    it('stores the tokens and user after login', async () => {
      const done = auth.login({ email: 'aya@test.com', password: 'test123' });
      const req = http.expectOne(`${API}/api/auth/login`);
      expect(req.request.body).toEqual({ email: 'aya@test.com', password: 'test123' });
      req.flush(loginResponse);
      await done;

      expect(auth.user()).toEqual(testUser);
      expect(tokens.getAccessToken()).toBe('access');
      expect(tokens.getRefreshToken()).toBe('refresh');
    });

    it('rethrows a failed login and stays signed out', async () => {
      const done = auth.login({ email: 'aya@test.com', password: 'wrong' });
      http
        .expectOne(`${API}/api/auth/login`)
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      await expect(done).rejects.toBeTruthy();
      expect(auth.isAuthenticated()).toBe(false);
      expect(tokens.hasTokens()).toBe(false);
    });

    it('stores the tokens and user after registering', async () => {
      const data = { username: 'aya', email: 'aya@test.com', password: 'test123' };
      const done = auth.register(data);
      const req = http.expectOne(`${API}/api/auth/register`);
      expect(req.request.body).toEqual(data);
      req.flush(loginResponse);
      await done;

      expect(auth.user()).toEqual(testUser);
      expect(tokens.hasTokens()).toBe(true);
    });
  });

  describe('logout', () => {
    beforeEach(async () => {
      const done = auth.login({ email: 'aya@test.com', password: 'test123' });
      http.expectOne(`${API}/api/auth/login`).flush(loginResponse);
      await done;
    });

    it('clears the session after the API call', async () => {
      const done = auth.logout();
      http.expectOne(`${API}/api/auth/logout`).flush(null);
      await done;

      expect(auth.isAuthenticated()).toBe(false);
      expect(tokens.hasTokens()).toBe(false);
    });

    it('clears the session even when the API call fails', async () => {
      const done = auth.logout();
      http
        .expectOne(`${API}/api/auth/logout`)
        .flush(null, { status: 500, statusText: 'Server Error' });
      await done;

      expect(auth.isAuthenticated()).toBe(false);
      expect(tokens.hasTokens()).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('stores the new pair and skips the auth interceptor', () => {
      tokens.setTokens('old-access', 'old-refresh');
      let result: string | undefined;
      auth.refreshAccessToken().subscribe((token) => (result = token));

      const req = http.expectOne(`${API}/api/auth/refresh`);
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh' });
      expect(req.request.context.get(SKIP_AUTH_REFRESH)).toBe(true);
      req.flush({ ...loginResponse, accessToken: 'new-access', refreshToken: 'new-refresh' });

      expect(result).toBe('new-access');
      expect(tokens.getRefreshToken()).toBe('new-refresh');
    });

    it('shares one request between concurrent callers', () => {
      tokens.setTokens('old-access', 'old-refresh');
      const results: string[] = [];
      auth.refreshAccessToken().subscribe((token) => results.push(token));
      auth.refreshAccessToken().subscribe((token) => results.push(token));

      http.expectOne(`${API}/api/auth/refresh`).flush(loginResponse);
      expect(results).toEqual(['access', 'access']);
    });

    it('ends the session when there is no refresh token', () => {
      let error: unknown;
      auth.refreshAccessToken().subscribe({ error: (e) => (error = e) });

      http.expectNone(`${API}/api/auth/refresh`);
      expect(error).toBeInstanceOf(Error);
      expect(navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getFreshAccessToken', () => {
    it('rejects without an access token', async () => {
      await expect(auth.getFreshAccessToken()).rejects.toThrow('No access token available');
    });

    it('returns a token that is not about to expire', async () => {
      const token = jwtExpiringIn(3600);
      tokens.setTokens(token, 'refresh');
      await expect(auth.getFreshAccessToken()).resolves.toBe(token);
      http.expectNone(`${API}/api/auth/refresh`);
    });

    it('refreshes a token that is about to expire', async () => {
      tokens.setTokens(jwtExpiringIn(5), 'refresh');
      const fresh = auth.getFreshAccessToken();
      http
        .expectOne(`${API}/api/auth/refresh`)
        .flush({ ...loginResponse, accessToken: 'fresh-access' });
      await expect(fresh).resolves.toBe('fresh-access');
    });
  });
});
