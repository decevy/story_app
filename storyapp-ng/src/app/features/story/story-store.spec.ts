import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { AuthService } from '../../core/auth/auth';
import { APP_CONFIG } from '../../core/config/app-config';
import { User } from '../../core/models/auth.types';
import { Passage, PassageSegmentInput } from '../../core/models/story.types';
import { ConnectionState, SignalRService } from '../../core/signalr/signalr';
import { makePassage, makeStory, testUser } from '../../../testing/fixtures';
import { deferred } from '../../../testing/helpers';
import { StoryStore } from './story-store';

describe('StoryStore', () => {
  let store: StoryStore;
  let http: HttpTestingController;
  let passageReceived: Subject<Passage>;
  let signalR: {
    connectionState: ReturnType<typeof signal<ConnectionState>>;
    passageReceived$: Subject<Passage>;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    isConnected: () => boolean;
    joinStory: ReturnType<typeof vi.fn>;
    leaveStory: ReturnType<typeof vi.fn>;
    sendPassage: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    passageReceived = new Subject<Passage>();
    const connectionState = signal<ConnectionState>('disconnected');
    signalR = {
      connectionState,
      passageReceived$: passageReceived,
      connect: vi.fn(async () => connectionState.set('connected')),
      disconnect: vi.fn(async () => connectionState.set('disconnected')),
      isConnected: () => connectionState() === 'connected',
      joinStory: vi.fn(async () => undefined),
      leaveStory: vi.fn(async () => undefined),
      sendPassage: vi.fn(async () => undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiUrl: '', hubUrl: '/storyHub' } },
        { provide: AuthService, useValue: { user: signal<User | null>(testUser) } },
        { provide: SignalRService, useValue: signalR },
        StoryStore,
      ],
    });
    store = TestBed.inject(StoryStore);
    http = TestBed.inject(HttpTestingController);

    TestBed.tick();
    await Promise.resolve(); // connect() resolves
    TestBed.tick();
    http.expectOne('/api/stories').flush([]);
  });

  afterEach(() => http.verify());

  async function openStory(id: number, passages: Passage[] = []): Promise<void> {
    store.selectStory(id);
    TestBed.tick();
    http.expectOne(`/api/stories/${id}`).flush(makeStory({ id }));
    http
      .expectOne((r) => r.url === `/api/stories/${id}/passages`)
      .flush({
        items: passages,
        page: 1,
        pageSize: 50,
        totalCount: passages.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    await TestBed.inject(ApplicationRef).whenStable();
  }

  it('connects for the signed-in user and loads stories', () => {
    expect(signalR.connect).toHaveBeenCalledOnce();
    expect(store.isConnected()).toBe(true);
  });

  it('loads the selected story and joins its hub group', async () => {
    await openStory(3, [makePassage({ id: 10, storyId: 3 })]);
    expect(store.currentStory()?.id).toBe(3);
    expect(store.passages().map((p) => p.id)).toEqual([10]);
    expect(signalR.joinStory).toHaveBeenCalledWith(3);
  });

  it('leaves the previous story when switching', async () => {
    await openStory(3);
    await openStory(4);
    expect(signalR.leaveStory).toHaveBeenCalledWith(3);
    expect(signalR.joinStory).toHaveBeenLastCalledWith(4);
  });

  it('appends received passages only for the selected story', async () => {
    await openStory(3, [makePassage({ id: 10, storyId: 3 })]);
    passageReceived.next(makePassage({ id: 11, storyId: 99 }));
    passageReceived.next(makePassage({ id: 12, storyId: 3 }));
    expect(store.passages().map((p) => p.id)).toEqual([10, 12]);
  });

  it('ignores a second send while one is in flight (DEC-7)', async () => {
    await openStory(3);
    const inFlight = deferred<undefined>();
    signalR.sendPassage.mockReturnValueOnce(inFlight.promise);
    const segments: PassageSegmentInput[] = [{ order: 0, text: 'Hello ' }];

    const first = store.sendPassage(segments);
    const second = store.sendPassage(segments);
    expect(await second).toBe(false);
    expect(store.isSending()).toBe(true);

    inFlight.resolve(undefined);
    expect(await first).toBe(true);
    expect(store.isSending()).toBe(false);
    expect(signalR.sendPassage).toHaveBeenCalledOnce();

    expect(await store.sendPassage(segments)).toBe(true);
    expect(signalR.sendPassage).toHaveBeenCalledTimes(2);
  });

  it('ignores sends without text and passes seamBefore through', async () => {
    await openStory(3);
    expect(await store.sendPassage([{ order: 0, text: '   ' }])).toBe(false);
    await store.sendPassage([{ order: 0, text: 'Hi ' }], 1);
    expect(signalR.sendPassage).toHaveBeenCalledWith(3, [{ order: 0, text: 'Hi ' }], 1);
  });
});
