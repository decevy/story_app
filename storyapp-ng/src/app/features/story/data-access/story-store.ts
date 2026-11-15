import {
  computed,
  effect,
  inject,
  Injectable,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Logger } from '@core/logging/logger';
import type { Passage, PassageSegmentInput, Seam, Story } from '@core/models/story';
import { Notifier } from '@core/notifications/notifier';
import { StoryHubClient } from '@core/story-hub/story-hub-client';

import { StoriesApi } from './stories-api';

interface OpenStory {
  story: Story;
  passages: Passage[];
}

/**
 * State of the story area: the story list, the open story with its passages, hub group
 * membership and sending. Provided on the story route, so it is destroyed when the route is left.
 * The route (`/stories/:storyId`) decides which story is open; see `StoryView`.
 */
@Injectable()
export class StoryStore {
  private readonly api = inject(StoriesApi);
  private readonly hub = inject(StoryHubClient);
  private readonly logger = inject(Logger);
  private readonly notifier = inject(Notifier);

  private readonly selectedId = signal<number | null>(null);
  readonly selectedStoryId = this.selectedId.asReadonly();

  private readonly storiesResource = this.api.storiesResource();
  readonly stories = computed(() =>
    this.storiesResource.hasValue() ? this.storiesResource.value() : [],
  );
  readonly storiesFailed = computed(() => this.storiesResource.error() !== undefined);

  private readonly storyResource = this.api.storyResource(this.selectedId);
  private readonly passagesResource = this.api.passagesResource(this.selectedId);

  /** True when the selected story or its passages could not be loaded (no access, not found). */
  readonly storyFailed = computed(
    () => this.storyResource.error() !== undefined || this.passagesResource.error() !== undefined,
  );

  /** Story and first page, once both have loaded for the selected id. */
  private readonly loaded = computed<OpenStory | null>(() => {
    const id = this.selectedId();
    // value() throws while a resource is in an error state, so check hasValue() first.
    const story = this.storyResource.hasValue() ? this.storyResource.value() : undefined;
    const page = this.passagesResource.hasValue() ? this.passagesResource.value() : undefined;
    if (id == null || story?.id !== id || page === undefined) {
      return null;
    }
    return { story, passages: page.items };
  });

  /** The open story. While the next one loads, the previous one stays on screen. */
  private readonly open = linkedSignal<OpenStory | null, OpenStory | null>({
    source: this.loaded,
    computation: (loaded, previous) => loaded ?? previous?.value ?? null,
  });

  readonly currentStory = computed(() => this.open()?.story ?? null);
  readonly passages = computed(() => this.open()?.passages ?? []);
  readonly lastPassage = computed(() => this.passages().at(-1) ?? null);
  readonly isConnected = this.hub.isConnected;

  private readonly sending = signal(false);
  readonly isSending = this.sending.asReadonly();

  constructor() {
    // Hub group membership follows the selection. Re-runs after a reconnect, which rejoins the
    // current story (the previous run's cleanup left it, if still connected).
    effect((onCleanup) => {
      const storyId = this.selectedId();
      if (storyId == null || !this.hub.isConnected()) {
        return;
      }
      untracked(() => {
        this.hub
          .joinStory(storyId)
          .then(() => {
            this.logger.debug(`Joined story ${storyId}`);
          })
          .catch((error: unknown) => {
            this.logger.error(`Failed to join story ${storyId}:`, error);
          });
      });
      onCleanup(() => {
        if (untracked(this.hub.isConnected)) {
          this.hub.leaveStory(storyId).catch((error: unknown) => {
            this.logger.error(`Failed to leave story ${storyId}:`, error);
          });
        }
      });
    });

    this.hub
      .on('ReceivePassage')
      .pipe(takeUntilDestroyed())
      .subscribe((passage) => {
        this.logger.debug('New passage received:', passage);
        if (passage.storyId !== this.selectedId()) {
          return;
        }
        this.open.update((open) => open && { ...open, passages: [...open.passages, passage] });
      });
  }

  selectStory(storyId: number): void {
    // A failed connection is retried when the user opens a story.
    if (this.hub.connectionState() === 'disconnected') {
      this.hub.connect().catch(() => undefined);
    }
    this.selectedId.set(storyId);
  }

  leaveCurrentStory(): void {
    this.selectedId.set(null);
    this.open.set(null);
  }

  reloadStories(): void {
    this.storiesResource.reload();
  }

  /**
   * Sends the draft over SignalR. Resolves `true` once sent and `false` when it was not: no open
   * story (or the next one is still loading), no text, a send already in flight (DEC-7), or the
   * hub call failed (the user is told).
   */
  async sendPassage(segments: PassageSegmentInput[], seamBefore?: Seam): Promise<boolean> {
    const storyId = this.currentStory()?.id;
    const hasText = segments.some((segment) => segment.text.trim().length > 0);
    if (storyId === undefined || storyId !== this.selectedId() || !hasText || this.sending()) {
      return false;
    }

    this.sending.set(true);
    try {
      await this.hub.sendPassage(storyId, segments, seamBefore);
      this.logger.debug(`Passage sent in story ${storyId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send passage in story ${storyId}:`, error);
      this.notifier.error('Your passage could not be sent. Please try again.');
      return false;
    } finally {
      this.sending.set(false);
    }
  }
}
