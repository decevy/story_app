import { TestBed } from '@angular/core/testing';

import { apiUrl, injectApiUrl, isApiUrl } from './api-url';
import { APP_CONFIG } from './app-config';

const config = { apiUrl: 'https://api.test', hubUrl: '' };

describe('api-url', () => {
  it('prefixes the path with the API origin and /api', () => {
    expect(apiUrl(config, '/stories')).toBe('https://api.test/api/stories');
    expect(apiUrl({ apiUrl: '', hubUrl: '' }, '/stories')).toBe('/api/stories');
  });

  it('recognises URLs of the REST API', () => {
    expect(isApiUrl(config, 'https://api.test/api/stories')).toBe(true);
    expect(isApiUrl(config, 'https://other.test/api/stories')).toBe(false);
    expect(isApiUrl(config, 'https://api.test/storyHub')).toBe(false);
  });

  it('injectApiUrl builds URLs from the injected config', () => {
    TestBed.configureTestingModule({ providers: [{ provide: APP_CONFIG, useValue: config }] });
    const url = TestBed.runInInjectionContext(() => injectApiUrl());
    expect(url('/auth/me')).toBe('https://api.test/api/auth/me');
  });
});
