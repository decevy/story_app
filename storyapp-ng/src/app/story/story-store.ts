import { httpResource } from '@angular/common/http';
import {
  Injectable,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, exhaustMap, finalize, from, tap } from 'rxjs';

import { AuthService } from '../auth/auth';
import { APP_CONFIG } from '../core/config/app-config';
import { apiUrl } from '../core/config/api-url';
import { debugLog } from '../core/logging/debug-log';
import {
  PaginatedResponse,
  Passage,
  PassageSegmentInput,
  Seam,
  Story,
  StorySummary,
} from '../core/models/story.types';
import { SignalRService } from '../core/signalr/signalr';

interface SendRequest {
  storyId: number;
  segments: PassageSegmentInput[];
  seamBefore?: Seam;
  accepted: boolean;
  resolve: (sent: boolean) => void;
  reject: (error: unknown) => void;
}

/** Replaces storyapp-web/src/contexts/StoryContext.tsx. Provided on the story route. */
@Injectable()
export class StoryStore {
  private readonly auth = inject(AuthService);
  private readonly signalR = inject(SignalRService);
  private readonly config = inject(APP_CONFIG);

  readonly selectedStoryId = signal<number | null>(null);

  /** Stories load after the hub connection is up, like StoryContext. */
  private readonly storiesEnabled = signal(false);

  readonly stories = httpResource<StorySummary[]>(
    () => (this.storiesEnabled() ? apiUrl(this.config, '/stories') : undefined),
    { defaultValue: [] },
  );

  readonly story = httpResource<Story>(() => {
    const id = this.selectedStoryId();
    return id == null ? undefined : apiUrl(this.config, `/stories/${id}`);
  });

  readonly passagesPage = httpResource<PaginatedResponse<Passage>>(() => {
    const id = this.selectedStoryId();
    return id == null
      ? undefined
      : { url: apiUrl(this.config, `/stories/${id}/passages`), params: { page: 1, pageSize: 50 } };
  });

  /**
   * Story and its first page, once both have loaded for the selected id. Until then the
   * previous story stays on screen, like StoryContext's setState after Promise.all.
   */
  private readonly loaded = computed(() => {
    const id = this.selectedStoryId();
    if (id == null || !this.story.hasValue() || !this.passagesPage.hasValue()) {
      return null;
    }
    const story = this.story.value();
    return story.id === id ? { story, items: this.passagesPage.value().items } : null;
  });

  readonly currentStory = linkedSignal<{ story: Story } | null, Story | null>({
    source: this.loaded,
    computation: (loaded, previous) => loaded?.story ?? previous?.value ?? null,
  });

  readonly passages = linkedSignal<{ items: Passage[] } | null, Passage[]>({
    source: this.loaded,
    computation: (loaded, previous) => loaded?.items ?? previous?.value ?? [],
  });

  readonly lastPassage = computed(() => this.passages().at(-1) ?? null);
  readonly isConnected = computed(() => this.signalR.connectionState() === 'connected');
  readonly isLoading = computed(
    () => this.stories.isLoading() || this.story.isLoading() || this.passagesPage.isLoading(),
  );

  private readonly sending = signal(false);
  readonly isSending = this.sending.asReadonly();
  private readonly sendRequests = new Subject<SendRequest>();

  constructor() {
    // Connect when a user is signed in; disconnect on logout or when the route is left.
    effect((onCleanup) => {
      const user = this.auth.user();
      if (!user) {
        return;
      }
      untracked(() => void this.connectAndLoad());
      // Also runs when the route injector is destroyed (withAutoCleanupInjectors).
      onCleanup(() => {
        this.storiesEnabled.set(false);
        this.leaveCurrentStory();
        this.signalR.disconnect().catch(console.error);
      });
    });

    // Hub group membership follows the selection. Re-runs after a reconnect, which
    // rejoins the current story (the previous run's cleanup left it, if still connected).
    effect((onCleanup) => {
      const storyId = this.selectedStoryId();
      const connected = this.isConnected();
      if (storyId == null || !connected) {
        return;
      }
      untracked(() => {
        this.signalR
          .joinStory(storyId)
          .then(() => debugLog(`Joined story: ${storyId}`))
          .catch((error) => console.error(`Failed to join story ${storyId}:`, error));
      });
      onCleanup(() => {
        if (this.signalR.isConnected()) {
          this.signalR
            .leaveStory(storyId)
            .catch((error) => console.error(`Failed to leave story ${storyId}:`, error));
        }
      });
    });

    this.signalR.passageReceived$.pipe(takeUntilDestroyed()).subscribe((passage) => {
      debugLog('New passage received:', passage);
      if (passage.storyId !== this.selectedStoryId()) {
        return;
      }
      this.passages.update((previous) => [...previous, passage]);
    });

    // DEC-7: a send while another is in flight is dropped (exhaustMap).
    this.sendRequests
      .pipe(
        exhaustMap((request) => {
          request.accepted = true;
          this.sending.set(true);
          let failure: { error: unknown } | null = null;
          return from(
            this.signalR.sendPassage(request.storyId, request.segments, request.seamBefore),
          ).pipe(
            tap(() => debugLog(`Passage sent in story ${request.storyId}`)),
            catchError((error: unknown) => {
              console.error(`Failed to send passage in story ${request.storyId}:`, error);
              failure = { error };
              return EMPTY;
            }),
            finalize(() => {
              this.sending.set(false);
              // Settle the caller only after exhaustMap is idle again, so a send made
              // right after this one resolves is accepted.
              queueMicrotask(() =>
                failure ? request.reject(failure.error) : request.resolve(true),
              );
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  selectStory(storyId: number): void {
    if (!this.signalR.isConnected()) {
      void this.connectAndLoad();
    }
    this.selectedStoryId.set(storyId);
  }

  leaveCurrentStory(): void {
    this.selectedStoryId.set(null);
    this.currentStory.set(null);
    this.passages.set([]);
  }

  reloadStories(): void {
    this.stories.reload();
  }

  /**
   * Sends the draft over SignalR. Resolves `true` once sent, `false` when ignored (no
   * story, no text, or a send already in flight); rejects when the hub call fails.
   */
  sendPassage(segments: PassageSegmentInput[], seamBefore?: Seam): Promise<boolean> {
    const story = this.currentStory();
    if (!story || segments.length === 0) {
      return Promise.resolve(false);
    }
    const hasText = segments.some((segment) => segment.text.trim().length > 0);
    if (!hasText) {
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve, reject) => {
      const request: SendRequest = {
        storyId: story.id,
        segments,
        seamBefore,
        accepted: false,
        resolve,
        reject,
      };
      this.sendRequests.next(request);
      if (!request.accepted) {
        resolve(false);
      }
    });
  }

  private async connectAndLoad(): Promise<void> {
    try {
      await this.signalR.connect();
      this.storiesEnabled.set(true);
    } catch (error) {
      console.error('SignalR Connection Failed:', error);
    }
  }
}
