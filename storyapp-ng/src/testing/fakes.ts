// Fakes of core services, shared by specs. Only spec files may import from src/testing.
import { computed, signal } from '@angular/core';
import type { User } from '@core/models/user';
import type { Notification } from '@core/notifications/notifier';
import type { HubEventName, HubEvents } from '@core/story-hub/hub-events';
import type { ConnectionState } from '@core/story-hub/story-hub-client';
import { Subject } from 'rxjs';

import { testUser } from './fixtures';

/** Logger whose methods are spies, so specs stay quiet and can assert on errors. */
export function fakeLogger() {
  return { debug: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

export function fakeNotifier() {
  return {
    notifications: signal<Notification[]>([]),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  };
}

/** AuthService with a writable `user`; signed in as `testUser` unless `user` is null. */
export function fakeAuth(user: User | null = testUser) {
  const state = signal<User | null>(user);
  return {
    userState: state,
    user: state.asReadonly(),
    isAuthenticated: computed(() => state() !== null),
    login: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    logout: vi.fn(async () => undefined),
    getFreshAccessToken: vi.fn(async () => 'token'),
  };
}

/**
 * StoryHubClient with a writable `connectionState`. `connect()` succeeds immediately; `emit()`
 * delivers a hub event to `on()` subscribers.
 */
export function fakeHub(initialState: ConnectionState = 'connected') {
  const connectionState = signal<ConnectionState>(initialState);
  const subjects = new Map<HubEventName, Subject<unknown>>();
  const subject = (event: HubEventName) => {
    let found = subjects.get(event);
    if (!found) {
      found = new Subject<unknown>();
      subjects.set(event, found);
    }
    return found;
  };

  return {
    connectionState,
    isConnected: computed(() => connectionState() === 'connected'),
    on: vi.fn((event: HubEventName) => subject(event).asObservable()),
    emit<K extends HubEventName>(event: K, payload: HubEvents[K]): void {
      subject(event).next(payload);
    },
    connect: vi.fn(async () => {
      connectionState.set('connected');
    }),
    disconnect: vi.fn(async () => {
      connectionState.set('disconnected');
    }),
    joinStory: vi.fn(async (_storyId: number) => undefined),
    leaveStory: vi.fn(async (_storyId: number) => undefined),
    sendPassage: vi.fn(async (..._args: unknown[]) => undefined),
  };
}

export type FakeHub = ReturnType<typeof fakeHub>;
