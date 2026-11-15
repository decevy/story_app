import { loadAppConfig } from './app-config';

function fakeFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

describe('loadAppConfig', () => {
  it('returns the apiUrl and hubUrl from config.json', async () => {
    const fetchFn = fakeFetch({ apiUrl: 'https://api.test', hubUrl: 'https://api.test/storyHub' });
    await expect(loadAppConfig(fetchFn)).resolves.toEqual({
      apiUrl: 'https://api.test',
      hubUrl: 'https://api.test/storyHub',
    });
    expect(fetchFn).toHaveBeenCalledWith('config.json', { cache: 'no-cache' });
  });

  it('drops unknown fields', async () => {
    const config = await loadAppConfig(fakeFetch({ apiUrl: '', hubUrl: '/storyHub', extra: 1 }));
    expect(config).toEqual({ apiUrl: '', hubUrl: '/storyHub' });
  });

  it('rejects a config without the required fields', async () => {
    await expect(loadAppConfig(fakeFetch({ apiUrl: '' }))).rejects.toThrow(/hubUrl/);
  });

  it('rejects when the file cannot be loaded', async () => {
    await expect(loadAppConfig(fakeFetch({}, 404))).rejects.toThrow(/HTTP 404/);
  });
});
