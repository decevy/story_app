import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '@core/config/app-config';

import { PASSAGE_PAGE_SIZE, StoriesApi } from './stories-api';

const API = 'http://api.test';

describe('StoriesApi', () => {
  let api: StoriesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiUrl: API, hubUrl: `${API}/storyHub` } },
      ],
    });
    api = TestBed.inject(StoriesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the story list into a resource', () => {
    const stories = TestBed.runInInjectionContext(() => api.storiesResource());
    expect(stories.value()).toEqual([]);
    TestBed.tick();
    http.expectOne(`${API}/api/stories`).flush([]);
  });

  it('loads a story and its first page only while an id is set', () => {
    const id = signal<number | null>(null);
    TestBed.runInInjectionContext(() => {
      api.storyResource(id);
      api.passagesResource(id);
    });
    TestBed.tick();
    http.expectNone(() => true);

    id.set(3);
    TestBed.tick();
    http.expectOne(`${API}/api/stories/3`).flush({});
    const page = http.expectOne((r) => r.url === `${API}/api/stories/3/passages`);
    expect(page.request.params.get('page')).toBe('1');
    expect(page.request.params.get('pageSize')).toBe(String(PASSAGE_PAGE_SIZE));
    page.flush({ items: [] });
  });

  it('creates a story', () => {
    const body = { name: 'New', description: 'd', isPrivate: true };
    api.createStory(body).subscribe();
    const req = http.expectOne(`${API}/api/stories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  it('updates a story', () => {
    api.updateStory(3, { name: 'Renamed' }).subscribe();
    const req = http.expectOne(`${API}/api/stories/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Renamed' });
    req.flush({});
  });

  it('deletes a story', () => {
    api.deleteStory(3).subscribe();
    const req = http.expectOne(`${API}/api/stories/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('adds a writer', () => {
    api.addWriter(3, { userId: 9 }).subscribe();
    const req = http.expectOne(`${API}/api/stories/3/writers`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId: 9 });
    req.flush({ message: 'ok' });
  });

  it('removes a writer', () => {
    api.removeWriter(3, 9).subscribe();
    const req = http.expectOne(`${API}/api/stories/3/writers/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
