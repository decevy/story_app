import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { lastPassageSeam } from '@core/models/story';

import { StoryStore } from '../data-access/story-store';
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

  /** Holding Enter sends the draft; the colour shifts while it is held. */
  private readonly enterHold = createHoldTimer({
    onProgress: (progress) => {
      this.enterHoldProgress.set(progress);
    },
    onComplete: () => void this.sendDraft(),
  });

  /** Holding Backspace clears the whole draft. */
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

  handleComposerKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) {
        this.stopEnterHold();
        this.enterHold.start();
      }
      return;
    }

    if (event.key === 'Backspace') {
      if (event.repeat) {
        event.preventDefault();
        return;
      }
      this.backspaceHold.start();
      if (this.canStructuralBackspace(this.composer())) {
        event.preventDefault();
      }
    }
  }

  /** Enter released: a tap adds a break; after a completed hold (draft sent) it does nothing. */
  handleEnterTap(activeText: string): void {
    const sent = this.enterHold.takeCompleted();
    this.stopEnterHold();
    if (sent) {
      return;
    }
    const previousPassageLastSeam = this.previousPassageLastSeam();
    this.composer.update((previous) => {
      const existing = previous.segments[previous.activeIndex]?.text ?? '';
      const textToApply = activeText.length > 0 ? activeText : existing;
      return applyEnter(updateActiveSegmentText(previous, textToApply), previousPassageLastSeam);
    });
    this.bumpDraftVersion();
  }

  /** Backspace released: a tap on an empty segment removes a break; after a hold, nothing. */
  handleComposerKeyUp(event: KeyboardEvent): void {
    if (event.key !== 'Backspace') {
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

  private canStructuralBackspace(state: ComposerState): boolean {
    const active = state.segments[state.activeIndex];
    if (active == null || active.text.length > 0) {
      return false;
    }
    return state.activeIndex > 0 || state.seamBefore != null;
  }
}
