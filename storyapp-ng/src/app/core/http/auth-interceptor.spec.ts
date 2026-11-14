import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../auth/auth';
import { TokenStore } from '../../auth/token-store';
import { APP_CONFIG } from '../config/app-config';
import { authInterceptor } from './auth-interceptor';

const API = 'http://api.test';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let tokens: TokenStore;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: { apiUrl: API, hubUrl: `${API}/storyHub` } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStore);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    tokens.setTokens('old-access', 'old-refresh');
  });

  afterEach(() => controller.verify());

  function refreshSucceeds(): void {
    const refresh = controller.expectOne(`${API}/api/auth/refresh`);
    expect(refresh.request.body).toEqual({ refreshToken: 'old-refresh' });
    refresh.flush({ accessToken: 'new-access', refreshToken: 'new-refresh', user: {} });
  }

  it('adds the bearer token to API requests', () => {
    http.get(`${API}/api/stories`).subscribe();
    const req = controller.expectOne(`${API}/api/stories`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer old-access');
    req.flush([]);
  });

  it('leaves requests to other origins alone', () => {
    http.get('https://elsewhere.test/data').subscribe();
    const req = controller.expectOne('https://elsewhere.test/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('refreshes on 401 and retries the request with the new token', () => {
    let result: unknown;
    http.get(`${API}/api/stories`).subscribe((value) => (result = value));

    controller.expectOne(`${API}/api/stories`).flush(null, { status: 401, statusText: 'Unauthorized' });
    refreshSucceeds();

    const retry = controller.expectOne(`${API}/api/stories`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush([{ id: 1 }]);

    expect(result).toEqual([{ id: 1 }]);
    expect(tokens.getAccessToken()).toBe('new-access');
    expect(tokens.getRefreshToken()).toBe('new-refresh');
  });

  it('shares one refresh between concurrent 401s', () => {
    const results: unknown[] = [];
    http.get(`${API}/api/stories`).subscribe((value) => results.push(value));
    http.get(`${API}/api/stories/1`).subscribe((value) => results.push(value));

    controller.expectOne(`${API}/api/stories`).flush(null, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne(`${API}/api/stories/1`).flush(null, { status: 401, statusText: 'Unauthorized' });

    // expectOne fails if a second refresh was started.
    refreshSucceeds();

    const retries = controller.match((req) => req.url.startsWith(`${API}/api/stories`));
    expect(retries).toHaveLength(2);
    for (const retry of retries) {
      expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
      retry.flush('ok');
    }
    expect(results).toEqual(['ok', 'ok']);
  });

  it('clears the session and navigates to /login when the refresh fails', () => {
    const auth = TestBed.inject(AuthService);
    let error: unknown;
    http.get(`${API}/api/stories`).subscribe({ error: (e) => (error = e) });

    controller.expectOne(`${API}/api/stories`).flush(null, { status: 401, statusText: 'Unauthorized' });
    controller
      .expectOne(`${API}/api/auth/refresh`)
      .flush({ error: 'Invalid or expired refresh token' }, { status: 401, statusText: 'Unauthorized' });

    expect(error).toBeTruthy();
    expect(tokens.getAccessToken()).toBeNull();
    expect(tokens.getRefreshToken()).toBeNull();
    expect(auth.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not intercept the refresh call itself', () => {
    http.get(`${API}/api/stories`).subscribe({ error: () => undefined });
    controller.expectOne(`${API}/api/stories`).flush(null, { status: 401, statusText: 'Unauthorized' });

    const refresh = controller.expectOne(`${API}/api/auth/refresh`);
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush(null, { status: 401, statusText: 'Unauthorized' });

    // A 401 on the refresh call must not start another refresh.
    controller.expectNone(`${API}/api/auth/refresh`);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('does not retry a request a second time', () => {
    let error: unknown;
    http.get(`${API}/api/stories`).subscribe({ error: (e) => (error = e) });
    controller.expectOne(`${API}/api/stories`).flush(null, { status: 401, statusText: 'Unauthorized' });
    refreshSucceeds();
    controller.expectOne(`${API}/api/stories`).flush(null, { status: 401, statusText: 'Unauthorized' });

    controller.expectNone(`${API}/api/auth/refresh`);
    expect(error).toBeTruthy();
  });
});
