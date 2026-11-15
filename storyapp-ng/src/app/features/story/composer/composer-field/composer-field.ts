import { Component, computed, input, output, viewChild } from '@angular/core';

import { PlainTextEditable } from '../plain-text-editable';
import {
  composerFieldLayoutClass,
  type SegmentStartVisual,
  segmentStartVisualIsBlock,
} from '../segment-visuals';

/** Enter went down (auto-repeat excluded) or came back up; `text` is the field's text then. */
export type EnterGesture = { phase: 'press' } | { phase: 'release'; text: string };

/** Backspace went down (auto-repeat excluded) or came back up. */
export type KeyPhase = 'press' | 'release';

/**
 * One segment of the draft. The host is `display: contents`, so the editable span sits directly
 * in the text flow; `saPlainTextEditable` does the contentEditable work.
 *
 * Enter and Backspace are reported as press/release gestures; the draft decides what a tap or a
 * hold means. The field only handles the key mechanics: Enter never inserts a line break, and
 * auto-repeated Backspace deletes nothing (holding it clears the draft instead).
 */
@Component({
  selector: 'sa-composer-field',
  imports: [PlainTextEditable],
  host: { class: 'contents' },
  templateUrl: './composer-field.html',
})
export class ComposerField {
  readonly text = input.required<string>();
  /** A change rewrites the DOM text and refocuses the active field (`DraftStore.draftVersion`). */
  readonly version = input.required<number>();
  readonly startVisual = input.required<SegmentStartVisual>();
  readonly isActive = input.required<boolean>();
  readonly disabled = input.required<boolean>();

  readonly textChange = output<string>();
  readonly focused = output();
  readonly blurred = output();
  readonly enter = output<EnterGesture>();
  readonly backspace = output<KeyPhase>();

  private readonly editable = viewChild.required(PlainTextEditable);

  /** Text at Enter press; used on release if the field emptied in between. Never rendered. */
  private textAtEnterPress = '';

  protected readonly isBlock = computed(() => segmentStartVisualIsBlock(this.startVisual()));
  protected readonly layoutClass = computed(() =>
    composerFieldLayoutClass(this.startVisual(), this.text().length === 0),
  );

  /** Puts the caret at the end of the field (used when the page around it is clicked). */
  focus(): void {
    this.editable().focus();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.editable().isComposing() || event.isComposing) {
      return;
    }
    if (event.key === 'Enter' && !event.repeat) {
      this.textAtEnterPress = this.editable().plainText();
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) {
        this.enter.emit({ phase: 'press' });
      }
      return;
    }

    if (event.key === 'Backspace') {
      // An empty field has nothing to delete; the draft may remove a break instead.
      if (event.repeat || this.editable().plainText().length === 0) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.backspace.emit('press');
      }
    }
  }

  protected onKeyUp(event: KeyboardEvent): void {
    if (this.editable().isComposing() || event.isComposing) {
      return;
    }
    if (event.key === 'Enter') {
      const text = this.editable().plainText() || this.textAtEnterPress;
      this.textAtEnterPress = '';
      this.enter.emit({ phase: 'release', text });
    } else if (event.key === 'Backspace') {
      this.backspace.emit('release');
    }
  }
}
