import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { lastPassageSeam } from '@core/models/story';

import { StoryStore } from '../data-access/story-store';
import type { EnterGesture, KeyPhase } from './composer-field/composer-field';
import { createHoldTimer } from './hold-timer';
import {
  applyBackspace,
  applyEnter,
  composerHasContent,
  type ComposerState,
  createEmptyComposer,
  setActiveSegmentIndex,
  toSegmentInputs,
  updateActiveSegmentText,
  updateSegmentText,
} from './passage-composer';

function randomDraftHue(): number {
  return Math.floor(Math.random() * 360);
}

function draftColorFromHue(hue: number, holdProgress: number): string {
  const shiftedHue = (hue + holdProgress * 360) % 360;
  return `hsl(${shiftedHue}, 70%, 42%)`;
}

/**
 * The draft passage, scoped to the story view: its segments, how Enter and Backspace change them
 * (tap = structural edit, hold = send or clear), and sending it.
 */
@Injectable()
export class DraftStore {
  private readonly store = inject(StoryStore);

  readonly composer = signal<ComposerState>(createEmptyComposer());

  /**
   * Bumped whenever the draft fields must rewrite their DOM text from `composer` and put the
   * caret back on the active field.
   */
  readonly draftVersion = signal(0);

  private readonly draftHue = signal(randomDraftHue());
  private readonly enterHoldProgress = signal(0);
  readonly draftColor = computed(() =>
    draftColorFromHue(this.draftHue(), this.enterHoldProgress()),
  );

  readonly previousPassageLastSeam = computed(() => {
    const last = this.store.lastPassage();
    return last != null ? lastPassageSeam(last) : undefined;
  });

  readonly disabled = computed(() => !this.store.isConnected() || this.store.isSending());
  readonly canSend = computed(() => !this.disabled() && composerHasContent(this.composer()));

  private readonly enterHold = createHoldTimer({
    onProgress: (progress) => {
      this.enterHoldProgress.set(progress);
    },
    onComplete: () => void this.sendDraft(),
  });

  private readonly backspaceHold = createHoldTimer({
    onComplete: () => {
      this.resetDraft();
    },
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.clearHoldTimers();
    });
  }

  clearHoldTimers(): void {
    this.stopEnterHold();
    this.backspaceHold.stop();
  }

  async sendDraft(): Promise<void> {
    const composer = this.composer();
    if (!composerHasContent(composer) || !this.store.isConnected()) {
      return;
    }
    const segments = toSegmentInputs(composer);
    if (segments.length === 0) {
      return;
    }
    // false = not sent (a send already in flight, or it failed); keep the draft.
    if (await this.store.sendPassage(segments, composer.seamBefore)) {
      this.resetDraft();
    }
  }

  /** Enter: a tap adds a break, a hold sends the draft (the colour shifts while it is held). */
  handleEnter(gesture: EnterGesture): void {
    if (gesture.phase === 'press') {
      this.stopEnterHold();
      this.enterHold.start();
      return;
    }
    const sent = this.enterHold.takeCompleted();
    this.stopEnterHold();
    if (sent) {
      return;
    }
    const { text } = gesture;
    const previousPassageLastSeam = this.previousPassageLastSeam();
    this.composer.update((previous) =>
      applyEnter(
        text.length > 0 ? updateActiveSegmentText(previous, text) : previous,
        previousPassageLastSeam,
      ),
    );
    this.bumpDraftVersion();
  }

  /** Backspace: a tap on an empty segment removes a break, a hold clears the draft. */
  handleBackspace(phase: KeyPhase): void {
    if (phase === 'press') {
      this.backspaceHold.start();
      return;
    }
    const cleared = this.backspaceHold.takeCompleted();
    this.backspaceHold.stop();
    if (cleared) {
      return;
    }
    const result = applyBackspace(this.composer(), this.previousPassageLastSeam());
    if (result.type === 'structural') {
      this.composer.set(result.state);
      this.bumpDraftVersion();
    }
  }

  handleSegmentTextChange(index: number, text: string): void {
    this.composer.update((previous) => updateSegmentText(previous, index, text));
  }

  handleSegmentFocus(index: number): void {
    this.composer.update((previous) => setActiveSegmentIndex(previous, index));
  }

  private resetDraft(): void {
    this.composer.set(createEmptyComposer());
    this.draftHue.set(randomDraftHue());
    this.enterHoldProgress.set(0);
    this.bumpDraftVersion();
  }

  private bumpDraftVersion(): void {
    this.draftVersion.update((version) => version + 1);
  }

  private stopEnterHold(): void {
    this.enterHold.stop();
    this.enterHoldProgress.set(0);
  }
}
