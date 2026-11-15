import {
  afterRenderEffect,
  Component,
  computed,
  DOCUMENT,
  type ElementRef,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';

import {
  CARET_ZWSP,
  hasAdjacentWhitespace,
  placeCaretAtEnd,
  placeCaretAtOffset,
  readPlainText,
  writePlainText,
} from '../composer-dom';
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
 * One contentEditable segment of the draft. The host is `display: contents`, so the editable
 * span sits directly in the text flow.
 *
 * Enter and Backspace are reported as press/release gestures; the draft decides what a tap or a
 * hold means. The field only handles the key mechanics: Enter never inserts a line break, and
 * auto-repeated Backspace deletes nothing (holding it clears the draft instead).
 */
@Component({
  selector: 'sa-composer-field',
  host: { class: 'contents' },
  templateUrl: './composer-field.html',
})
export class ComposerField {
  private readonly document = inject(DOCUMENT);

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

  private readonly editable = viewChild.required<ElementRef<HTMLSpanElement>>('editable');

  // IME / Enter bookkeeping is never rendered.
  private isComposing = false;
  /** Text at Enter press; used on release if the field emptied in between. */
  private textAtEnterPress = '';

  protected readonly isBlock = computed(() => segmentStartVisualIsBlock(this.startVisual()));
  protected readonly layoutClass = computed(() => composerFieldLayoutClass(this.startVisual()));

  constructor() {
    // On a new version (or enable/disable): write the draft text, focus the active field.
    afterRenderEffect(() => {
      this.version();
      const disabled = this.disabled();
      untracked(() => {
        const element = this.editable().nativeElement;
        writePlainText(element, this.text());
        if (!disabled && this.isActive()) {
          requestAnimationFrame(() => {
            // The field may have been disabled or deactivated during this frame.
            if (this.disabled() || !this.isActive()) {
              return;
            }
            if (this.document.activeElement !== element) {
              element.focus({ preventScroll: true });
            }
            placeCaretAtEnd(element);
          });
        }
      });
    });

    // Put the caret back when the selection leaves the focused active field.
    afterRenderEffect((onCleanup) => {
      if (this.disabled() || !this.isActive()) {
        return;
      }
      const element = this.editable().nativeElement;

      const restoreCaretIfLost = () => {
        if (this.isComposing || this.document.activeElement !== element) {
          return;
        }
        const selection = this.document.getSelection();
        if (!selection || selection.rangeCount === 0 || !element.contains(selection.anchorNode)) {
          this.ensureCaretHost();
          placeCaretAtEnd(element);
        }
      };

      this.document.addEventListener('selectionchange', restoreCaretIfLost);
      onCleanup(() => {
        this.document.removeEventListener('selectionchange', restoreCaretIfLost);
      });
    });
  }

  /** Puts the caret at the end of the field (used when the page around it is clicked). */
  focus(): void {
    if (this.disabled()) {
      return;
    }
    this.ensureCaretHost();
    placeCaretAtEnd(this.editable().nativeElement);
  }

  // `input` and `paste` only fire while the field is editable, so they need no disabled check.
  protected onInput(): void {
    const element = this.editable().nativeElement;
    const previous = this.text();
    const plain = readPlainText(element);

    if (plain.length === 0 && element.textContent !== CARET_ZWSP) {
      writePlainText(element, '');
      placeCaretAtEnd(element);
    }

    if (hasAdjacentWhitespace(plain)) {
      writePlainText(element, previous);
      const duplicateAt = plain.search(/\s{2,}/);
      placeCaretAtOffset(element, duplicateAt >= 0 ? duplicateAt + 1 : previous.length);
      return;
    }

    this.textChange.emit(plain);
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pasted = (event.clipboardData?.getData('text/plain') ?? '')
      .replace(/\r?\n/g, '')
      .replace(/\u00a0/g, ' ');

    if (pasted.length === 0) {
      return;
    }

    // Deprecated, but still the only way to insert text that the browser's undo stack tracks.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.document.execCommand('insertText', false, pasted);
    this.onInput();
  }

  protected onCompositionStart(): void {
    this.isComposing = true;
  }

  protected onCompositionEnd(): void {
    this.isComposing = false;
    this.onInput();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.isComposing || event.isComposing) {
      return;
    }
    if (event.key === 'Enter' && !event.repeat) {
      this.textAtEnterPress = this.plainText();
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
      if (event.repeat || this.plainText().length === 0) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.backspace.emit('press');
      }
    }
  }

  protected onKeyUp(event: KeyboardEvent): void {
    if (this.isComposing || event.isComposing) {
      return;
    }
    if (event.key === 'Enter') {
      const text = this.plainText() || this.textAtEnterPress;
      this.textAtEnterPress = '';
      this.enter.emit({ phase: 'release', text });
    } else if (event.key === 'Backspace') {
      this.backspace.emit('release');
    }
  }

  protected onFocus(): void {
    this.ensureCaretHost();
    this.focused.emit();
  }

  private plainText(): string {
    return readPlainText(this.editable().nativeElement);
  }

  private ensureCaretHost(): void {
    const element = this.editable().nativeElement;
    if (readPlainText(element).length === 0 && element.textContent !== CARET_ZWSP) {
      writePlainText(element, '');
    }
  }
}
