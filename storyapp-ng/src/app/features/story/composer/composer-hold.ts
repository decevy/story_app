import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { lastPassageSeam } from '../../../core/models/story.types';
import { StoryStore } from '../story-store';
import {
  applyBackspace,
  applyEnter,
  composerHasContent,
  createEmptyComposer,
  setActiveSegmentIndex,
  toSegmentInputs,
  updateActiveSegmentText,
  updateSegmentText,
  type ComposerState,
} from './passage-composer';

const HOLD_MS = 1500;

function randomDraftHue(): number {
  return Math.floor(Math.random() * 360);
}

function draftColorFromHue(hue: number, holdProgress: number): string {
  const shiftedHue = (hue + holdProgress * 360) % 360;
  return `hsl(${shiftedHue}, 70%, 42%)`;
}

/**
 * Port of storyapp-web/src/components/useComposerHold.ts, scoped to the story view.
 * Owns the draft (`composer`) and the Enter / Backspace tap-vs-hold handling.
 */
@Injectable()
export class ComposerHold {
  private readonly store = inject(StoryStore);

  readonly composer = signal<ComposerState>(createEmptyComposer());

  /**
   * Replaces React's seedToken: bumped whenever the draft fields must rewrite their DOM
   * text from `composer` and put the caret back on the active field.
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

  readonly isSending = this.store.isSending;
  readonly disabled = computed(() => !this.store.isConnected() || this.store.isSending());
  readonly canSend = computed(() => !this.disabled() && composerHasContent(this.composer()));

  // Timer bookkeeping; never read by templates.
  private enterHoldStart: number | null = null;
  private enterHoldRaf: number | null = null;
  private enterHoldSent = false;
  private backspaceHoldStart: number | null = null;
  private backspaceHoldRaf: number | null = null;
  private backspaceHoldFired = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearHoldTimers());
  }

  clearHoldTimers(): void {
    this.stopEnterHold();
    this.stopBackspaceHold();
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

    try {
      const sent = await this.store.sendPassage(segments, composer.seamBefore);
      // false = dropped because a send is already in flight (DEC-7); keep the draft.
      if (sent) {
        this.composer.set(createEmptyComposer());
        this.resetDraftAppearance();
        this.bumpDraftVersion();
      }
    } catch (error) {
      console.error('Failed to send passage:', error);
    }
  }

  handleComposerKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      this.startEnterHold();
      return;
    }

    if (event.key === 'Backspace') {
      if (event.repeat) {
        event.preventDefault();
        return;
      }
      this.startBackspaceHold();
      if (this.canStructuralBackspace(this.composer())) {
        event.preventDefault();
      }
    }
  }

  handleEnterTap(activeText: string): void {
    const sent = this.enterHoldSent;
    this.stopEnterHold();
    if (!sent) {
      const previousPassageLastSeam = this.previousPassageLastSeam();
      this.composer.update((previous) => {
        const existing = previous.segments[previous.activeIndex]?.text ?? '';
        const textToApply = activeText.length > 0 ? activeText : existing;
        return applyEnter(updateActiveSegmentText(previous, textToApply), previousPassageLastSeam);
      });
      this.bumpDraftVersion();
    }
    this.enterHoldSent = false;
  }

  handleComposerKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const cleared = this.backspaceHoldFired;
      this.stopBackspaceHold();
      if (cleared) {
        this.backspaceHoldFired = false;
        return;
      }

      const result = applyBackspace(this.composer(), this.previousPassageLastSeam());
      if (result.type === 'structural') {
        this.composer.set(result.state);
        this.bumpDraftVersion();
      }
      this.backspaceHoldFired = false;
    }
  }

  handleSegmentTextChange(index: number, text: string): void {
    this.composer.update((previous) => updateSegmentText(previous, index, text));
  }

  handleSegmentFocus(index: number): void {
    this.composer.update((previous) => setActiveSegmentIndex(previous, index));
  }

  private bumpDraftVersion(): void {
    this.draftVersion.update((version) => version + 1);
  }

  private resetDraftAppearance(): void {
    this.draftHue.set(randomDraftHue());
    this.enterHoldProgress.set(0);
  }

  private stopEnterHold(): void {
    if (this.enterHoldRaf !== null) {
      cancelAnimationFrame(this.enterHoldRaf);
      this.enterHoldRaf = null;
    }
    this.enterHoldStart = null;
    this.enterHoldProgress.set(0);
  }

  private stopBackspaceHold(): void {
    if (this.backspaceHoldRaf !== null) {
      cancelAnimationFrame(this.backspaceHoldRaf);
      this.backspaceHoldRaf = null;
    }
    this.backspaceHoldStart = null;
  }

  private startEnterHold(): void {
    this.stopEnterHold();
    this.enterHoldSent = false;
    this.enterHoldStart = performance.now();

    const tick = () => {
      const start = this.enterHoldStart;
      if (start === null) {
        return;
      }

      const progress = Math.min((performance.now() - start) / HOLD_MS, 1);
      this.enterHoldProgress.set(progress);

      if (progress >= 1) {
        this.enterHoldRaf = null;
        if (!this.enterHoldSent) {
          this.enterHoldSent = true;
          void this.sendDraft();
        }
        return;
      }

      this.enterHoldRaf = requestAnimationFrame(tick);
    };

    this.enterHoldRaf = requestAnimationFrame(tick);
  }

  private startBackspaceHold(): void {
    this.stopBackspaceHold();
    this.backspaceHoldFired = false;
    this.backspaceHoldStart = performance.now();

    const tick = () => {
      const start = this.backspaceHoldStart;
      if (start === null) {
        return;
      }

      const progress = Math.min((performance.now() - start) / HOLD_MS, 1);
      if (progress >= 1) {
        this.backspaceHoldRaf = null;
        if (!this.backspaceHoldFired) {
          this.backspaceHoldFired = true;
          this.composer.set(createEmptyComposer());
          this.resetDraftAppearance();
          this.bumpDraftVersion();
        }
        return;
      }

      this.backspaceHoldRaf = requestAnimationFrame(tick);
    };

    this.backspaceHoldRaf = requestAnimationFrame(tick);
  }

  private canStructuralBackspace(state: ComposerState): boolean {
    const active = state.segments[state.activeIndex];
    if (active == null || active.text.length > 0) {
      return false;
    }
    return state.activeIndex > 0 || state.seamBefore != null;
  }
}
