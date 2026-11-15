import { type APIRequestContext, type Browser, type BrowserContext } from '@playwright/test';

import { type TestUser } from './users';

/** Same keys as core/auth/token-store.ts. */
const TOKEN_KEYS = {
  accessToken: 'storyapp_access_token',
  refreshToken: 'storyapp_refresh_token',
};

export interface Session {
  accessToken: string;
  refreshToken: string;
}

interface StorySummary {
  id: number;
  name: string;
}

/** Signs in through the API (via the dev-server proxy), without the login page. */
export async function signIn(request: APIRequestContext, user: TestUser): Promise<Session> {
  const response = await request.post('/api/auth/login', { data: user });
  if (!response.ok()) {
    throw new Error(`Login for ${user.email} failed: HTTP ${response.status()}`);
  }
  const { accessToken, refreshToken } = (await response.json()) as Session;
  return { accessToken, refreshToken };
}

/** A browser context that starts signed in as `user` (tokens in localStorage). */
export async function signedInContext(
  browser: Browser,
  request: APIRequestContext,
  baseURL: string,
  user: TestUser,
): Promise<BrowserContext> {
  const session = await signIn(request, user);
  return browser.newContext({
    baseURL,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: new URL(baseURL).origin,
          localStorage: [
            { name: TOKEN_KEYS.accessToken, value: session.accessToken },
            { name: TOKEN_KEYS.refreshToken, value: session.refreshToken },
          ],
        },
      ],
    },
  });
}

/** Stories `user` can see. */
export async function storiesOf(
  request: APIRequestContext,
  user: TestUser,
): Promise<StorySummary[]> {
  const { accessToken } = await signIn(request, user);
  const response = await request.get('/api/stories', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return (await response.json()) as StorySummary[];
}

/** A story that every one of `users` writes in. */
export async function sharedStory(
  request: APIRequestContext,
  ...users: TestUser[]
): Promise<StorySummary> {
  const lists = await Promise.all(users.map((user) => storiesOf(request, user)));
  const [first = [], ...rest] = lists;
  const shared = first.find((story) => rest.every((list) => list.some((s) => s.id === story.id)));
  if (!shared) {
    throw new Error(`No story shared by ${users.map((user) => user.email).join(', ')}`);
  }
  return shared;
}
