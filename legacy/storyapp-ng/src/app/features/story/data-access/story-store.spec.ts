import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '@core/config/app-config';
import { Logger } from '@core/logging/logger';
import { type Passage, type PassageSegmentInput, Seam } from '@core/models/story';
import { Notifier } from '@core/notifications/notifier';
import { StoryHubClient } from '@core/story-hub/story-hub-client';
import { type FakeHub, fakeHub, fakeLogger, fakeNotifier } from '@testing/fakes';
import { makePassage, makeStory, makeStorySummary } from '@testing/fixtures';
import { deferred } from '@testing/helpers';

import { StoryStore } from './story-store';

describe('StoryStore', () => {
  let store: StoryStore;
  let http: HttpTestingController;
  let hub: FakeHub;
  let notifier: ReturnType<typeof fakeNotifier>;

  beforeEach(() => {
    hub = fakeHub('connected');
    notifier = fakeNotifier();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiUrl: '', hubUrl: '/storyHub' } },
        { provide: StoryHubClient, useValue: hub },
        { provide: Logger, useValue: fakeLogger() },
        { provide: Notifier, useValue: notifier },
        StoryStore,
      ],
    });
    store = TestBed.inject(StoryStore);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });

  afterEach(() => {
    http.verify();
  });

  function flushStories(): void {
    http.expectOne('/api/stories').flush([makeStorySummary({ id: 3 })]);
  }

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

  it('loads the stories without waiting for the hub', async () => {
    flushStories();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.stories().map((story) => story.id)).toEqual([3]);
    expect(store.storiesFailed()).toBe(false);
  });

  it('reports and retries a failed story list', async () => {
    http.expectOne('/api/stories').flush(null, { status: 500, statusText: 'Server Error' });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.storiesFailed()).toBe(true);

    store.reloadStories();
    TestBed.tick();
    flushStories();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.storiesFailed()).toBe(false);
  });

  it('loads the selected story and joins its hub group', async () => {
    flushStories();
    await openStory(3, [makePassage({ id: 10, storyId: 3 })]);
    expect(store.selectedStoryId()).toBe(3);
    expect(store.currentStory()?.id).toBe(3);
    expect(store.passages().map((p) => p.id)).toEqual([10]);
    expect(hub.joinStory).toHaveBeenCalledWith(3);
  });

  it('reports a story that cannot be loaded', async () => {
    flushStories();
    store.selectStory(404);
    TestBed.tick();
    http.expectOne('/api/stories/404').flush(null, { status: 404, statusText: 'Not Found' });
    http
      .expectOne((r) => r.url === '/api/stories/404/passages')
      .flush(null, {
        status: 404,
        statusText: 'Not Found',
      });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.storyFailed()).toBe(true);
    expect(store.currentStory()).toBeNull();
  });

  it('leaves the previous story when switching', async () => {
    flushStories();
    await openStory(3);
    await openStory(4);
    expect(hub.leaveStory).toHaveBeenCalledWith(3);
    expect(hub.joinStory).toHaveBeenLastCalledWith(4);
  });

  it('rejoins the story after a reconnect', async () => {
    flushStories();
    await openStory(3);
    hub.connectionState.set('reconnecting');
    TestBed.tick();
    hub.connectionState.set('connected');
    TestBed.tick();
    expect(hub.joinStory).toHaveBeenCalledTimes(2);
  });

  it('clears the open story when it is left', async () => {
    flushStories();
    await openStory(3);
    store.leaveCurrentStory();
    TestBed.tick();
    expect(store.currentStory()).toBeNull();
    expect(hub.leaveStory).toHaveBeenCalledWith(3);
  });

  it('retries a failed connection when a story is opened', () => {
    flushStories();
    hub.connectionState.set('disconnected');
    store.selectStory(3);
    expect(hub.connect).toHaveBeenCalledOnce();
    TestBed.tick();
    http.expectOne('/api/stories/3');
    http.expectOne((r) => r.url === '/api/stories/3/passages');
  });

  it('appends received passages only for the selected story', async () => {
    flushStories();
    await openStory(3, [makePassage({ id: 10, storyId: 3 })]);
    hub.emit('ReceivePassage', makePassage({ id: 11, storyId: 99 }));
    hub.emit('ReceivePassage', makePassage({ id: 12, storyId: 3 }));
    expect(store.passages().map((p) => p.id)).toEqual([10, 12]);
    expect(store.lastPassage()?.id).toBe(12);
  });

  describe('sendPassage', () => {
    const segments: PassageSegmentInput[] = [{ order: 0, text: 'Hello ' }];

    beforeEach(async () => {
      flushStories();
      await openStory(3);
    });

    it('ignores a second send while one is in flight (DEC-7)', async () => {
      const inFlight = deferred<undefined>();
      hub.sendPassage.mockReturnValueOnce(inFlight.promise);

      const first = store.sendPassage(segments);
      const second = store.sendPassage(segments);
      expect(await second).toBe(false);
      expect(store.isSending()).toBe(true);

      inFlight.resolve(undefined);
      expect(await first).toBe(true);
      expect(store.isSending()).toBe(false);
      expect(hub.sendPassage).toHaveBeenCalledOnce();

      expect(await store.sendPassage(segments)).toBe(true);
      expect(hub.sendPassage).toHaveBeenCalledTimes(2);
    });

    it('ignores sends without text and passes seamBefore through', async () => {
      expect(await store.sendPassage([{ order: 0, text: '   ' }])).toBe(false);
      await store.sendPassage([{ order: 0, text: 'Hi ' }], Seam.Paragraph);
      expect(hub.sendPassage).toHaveBeenCalledWith(3, [{ order: 0, text: 'Hi ' }], 1);
    });

    it('does not send into the previous story while the next one loads', async () => {
      store.selectStory(4);
      TestBed.tick();
      expect(await store.sendPassage(segments)).toBe(false);
      expect(hub.sendPassage).not.toHaveBeenCalled();
      http.expectOne('/api/stories/4');
      http.expectOne((r) => r.url === '/api/stories/4/passages');
    });

    it('tells the user when the hub call fails', async () => {
      hub.sendPassage.mockRejectedValueOnce(new Error('offline'));
      expect(await store.sendPassage(segments)).toBe(false);
      expect(store.isSending()).toBe(false);
      expect(notifier.error).toHaveBeenCalledWith(
        'Your passage could not be sent. Please try again.',
      );
    });
  });
});
