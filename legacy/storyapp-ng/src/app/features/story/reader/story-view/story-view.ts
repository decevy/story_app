import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  input,
  numberAttribute,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { lastPassageSeam, type Seam } from '@core/models/story';
import { persistedSignal } from '@core/storage/persisted-signal';

import { ComposerField } from '../../composer/composer-field/composer-field';
import { DraftStore } from '../../composer/draft-store';
import { getSegmentStartVisual, type SegmentStartVisual } from '../../composer/segment-visuals';
import { StoryStore } from '../../data-access/story-store';
import { BOOK_FONTS, DEFAULT_BOOK_FONT, FONT_STORAGE_KEY, isBookFontId } from '../book-fonts';
import { PassageSpan } from '../passage-span/passage-span';
import { StoryToolbar } from '../story-toolbar/story-toolbar';

/** The open story (route `/stories/:storyId`): the book page with its passages and the draft. */
@Component({
  selector: 'sa-story-view',
  imports: [ComposerField, PassageSpan, RouterLink, StoryToolbar],
  providers: [DraftStore],
  host: { class: 'contents' },
  templateUrl: './story-view.html',
})
export class StoryView {
  protected readonly store = inject(StoryStore);
  protected readonly draft = inject(DraftStore);

  /** From the route parameter (`withComponentInputBinding`). */
  readonly storyId = input.required({ transform: numberAttribute });

  protected readonly fontId = persistedSignal(FONT_STORAGE_KEY, DEFAULT_BOOK_FONT, isBookFontId);
  protected readonly fontStack = computed(() => BOOK_FONTS[this.fontId()].stack);

  private readonly anchor = viewChild<ElementRef<HTMLSpanElement>>('anchor');
  private readonly composerFields = viewChildren(ComposerField);

  /** Last seam of the passage before each passage (undefined for the first). */
  protected readonly previousSeams = computed<(Seam | undefined)[]>(() => {
    const passages = this.store.passages();
    return passages.map((_, index) => {
      const previous = passages[index - 1];
      return previous ? lastPassageSeam(previous) : undefined;
    });
  });

  /** Start visual per draft segment; only the first one depends on the story so far. */
  protected readonly draftStartVisuals = computed<SegmentStartVisual[]>(() => {
    const { segments, seamBefore } = this.draft.composer();
    const firstSeam = seamBefore ?? this.draft.previousPassageLastSeam();
    return segments.map((_, index) =>
      getSegmentStartVisual(segments, index, index === 0 ? firstSeam : undefined),
    );
  });

  /** Changes when a passage is added or the last one is edited. */
  private readonly passagesSignature = computed(() => {
    const last = this.store.passages().at(-1);
    return last ? `${last.id}-${last.createdAt}-${last.editedAt ?? ''}` : '';
  });

  constructor() {
    // The route decides which story is open.
    effect(() => {
      const storyId = this.storyId();
      untracked(() => {
        this.store.selectStory(storyId);
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.store.leaveCurrentStory();
    });

    // After new passages render, centre the stitch point before the draft.
    afterRenderEffect({
      read: () => {
        if (this.passagesSignature() !== '') {
          this.anchor()?.nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      },
    });
  }

  protected endPassage(): void {
    void this.draft.sendDraft();
  }

  /** A mousedown on the sheet, outside the draft fields, moves the caret into the draft. */
  protected onSheetMouseDown(event: MouseEvent): void {
    if (this.draft.disabled()) {
      return;
    }
    if (event.target instanceof Element && event.target.closest('.story-composer')) {
      return;
    }
    event.preventDefault();
    this.composerFields()[this.draft.composer().activeIndex]?.focus();
  }
}
