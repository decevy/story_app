import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';

import { ComposerField } from '../composer/composer-field';
import { ComposerHold } from '../composer/composer-hold';
import { getSegmentStartVisual, type SegmentStartVisual } from '../composer/segment-visuals';
import { lastPassageSeam } from '../core/models/story.types';
import { BOOK_FONTS, FONT_STORAGE_KEY, readStoredFontId, type BookFontId } from './book-fonts';
import { PassageSpan } from './passage-span';
import { StoryStore } from './story-store';

/** Port of storyapp-web/src/components/StoryView.tsx (book view + inline composer). */
@Component({
  selector: 'app-story-view',
  imports: [ComposerField, PassageSpan],
  providers: [ComposerHold],
  host: { class: 'contents' },
  templateUrl: './story-view.html',
})
export class StoryView {
  protected readonly store = inject(StoryStore);
  protected readonly hold = inject(ComposerHold);
  private readonly injector = inject(Injector);

  protected readonly fontIds = Object.keys(BOOK_FONTS) as BookFontId[];
  protected readonly fonts = BOOK_FONTS;
  protected readonly fontId = signal<BookFontId>(readStoredFontId());
  protected readonly fontStack = computed(() => BOOK_FONTS[this.fontId()].stack);

  private readonly anchor = viewChild<ElementRef<HTMLSpanElement>>('anchor');
  private readonly composerFields = viewChildren(ComposerField);

  /** Last seam of the passage before each passage (undefined for the first). */
  protected readonly previousSeams = computed(() => {
    const passages = this.store.passages();
    return passages.map((_, index) =>
      index > 0 ? lastPassageSeam(passages[index - 1]!) : undefined,
    );
  });

  /** Start visual per draft segment; only the first one depends on the story so far. */
  protected readonly draftStartVisuals = computed<SegmentStartVisual[]>(() => {
    const { segments, seamBefore } = this.hold.composer();
    const firstSeam = seamBefore ?? this.hold.previousPassageLastSeam();
    return segments.map((_, index) =>
      getSegmentStartVisual(segments, index, index === 0 ? firstSeam : undefined),
    );
  });

  private readonly passagesSignature = computed(() => {
    const last = this.store.passages().at(-1);
    return last ? `${last.id}-${last.createdAt}-${last.editedAt ?? ''}` : '';
  });

  constructor() {
    effect(() => {
      const fontId = this.fontId();
      try {
        localStorage.setItem(FONT_STORAGE_KEY, fontId);
      } catch {
        /* ignore */
      }
    });

    // After new passages render, centre the stitch point before the composer.
    effect((onCleanup) => {
      if (this.passagesSignature() === '') {
        return;
      }
      const ref = afterNextRender(
        {
          read: () =>
            this.anchor()?.nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' }),
        },
        { injector: this.injector },
      );
      onCleanup(() => ref.destroy());
    });
  }

  protected onFontChange(event: Event): void {
    this.fontId.set((event.target as HTMLSelectElement).value as BookFontId);
  }

  protected endPassage(): void {
    void this.hold.sendDraft();
  }

  private focusComposer(): void {
    if (this.hold.disabled()) {
      return;
    }
    this.composerFields()[this.hold.composer().activeIndex]?.focus();
  }

  protected onDraftZoneMouseDown(event: MouseEvent): void {
    if (this.hold.disabled()) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('.story-composer')) {
      return;
    }
    if (target.closest('[data-draft-text]')) {
      return;
    }
    if (target.classList.contains('draft-zone-fill')) {
      return;
    }
    event.preventDefault();
    this.focusComposer();
  }

  protected onDraftZoneFillMouseDown(event: MouseEvent): void {
    if (this.hold.disabled()) {
      return;
    }
    event.preventDefault();
    this.focusComposer();
  }

  protected onPageMouseDown(event: MouseEvent): void {
    if (this.hold.disabled()) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('.story-composer')) {
      return;
    }
    event.preventDefault();
    this.focusComposer();
  }
}
