import {
  afterRenderEffect,
  Directive,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';

import {
  CARET_ZWSP,
  placeCaretAtEnd,
  placeCaretAtOffset,
  readPlainText,
  writePlainText,
} from './composer-dom';
import { checkSegmentText } from './passage-composer';

/**
 * Makes an element a single-line plain-text editor for one segment: no markup, no line breaks,
 * no adjacent whitespace. Handles the contentEditable details: an empty element holds a
 * zero-width caret host, pastes are inserted as plain text, IME composition is respected, and
 * the active editor keeps its caret.
 *
 * The DOM text is only rewritten from `text` when `version` changes; while typing, the DOM leads
 * and `textChange` reports it.
 */
@Directive({
  selector: '[saPlainTextEditable]',
  host: {
    spellcheck: 'true',
    '[attr.contenteditable]': "disabled() ? 'false' : 'true'",
    '[attr.aria-disabled]': 'disabled()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '(input)': 'onInput()',
    '(paste)': 'onPaste($event)',
    '(compositionstart)': 'onCompositionStart()',
    '(compositionend)': 'onCompositionEnd()',
    '(focus)': 'ensureCaretHost()',
  },
})
export class PlainTextEditable {
  private readonly document = inject(DOCUMENT);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly text = input.required<string>();
  /** A change rewrites the DOM text and, when active, moves the caret to the end. */
  readonly version = input.required<number>();
  /** The active editor takes focus on a new version and keeps its caret. */
  readonly active = input.required<boolean>();
  readonly disabled = input.required<boolean>();

  readonly textChange = output<string>();

  // Never rendered.
  private composing = false;

  constructor() {
    // On a new version (or enable/disable): write the text, focus the active editor.
    afterRenderEffect(() => {
      this.version();
      const disabled = this.disabled();
      untracked(() => {
        writePlainText(this.element, this.text());
        if (!disabled && this.active()) {
          requestAnimationFrame(() => {
            // The editor may have been disabled or deactivated during this frame.
            if (this.disabled() || !this.active()) {
              return;
            }
            if (this.document.activeElement !== this.element) {
              this.element.focus({ preventScroll: true });
            }
            placeCaretAtEnd(this.element);
          });
        }
      });
    });

    // Put the caret back when the selection leaves the focused active editor.
    afterRenderEffect((onCleanup) => {
      if (this.disabled() || !this.active()) {
        return;
      }
      const restoreCaretIfLost = () => {
        if (this.composing || this.document.activeElement !== this.element) {
          return;
        }
        const selection = this.document.getSelection();
        if (
          !selection ||
          selection.rangeCount === 0 ||
          !this.element.contains(selection.anchorNode)
        ) {
          this.ensureCaretHost();
          placeCaretAtEnd(this.element);
        }
      };

      this.document.addEventListener('selectionchange', restoreCaretIfLost);
      onCleanup(() => {
        this.document.removeEventListener('selectionchange', restoreCaretIfLost);
      });
    });
  }

  /** The text in the DOM, without caret hosts. */
  plainText(): string {
    return readPlainText(this.element);
  }

  /** True during IME composition, when keys belong to the input method. */
  isComposing(): boolean {
    return this.composing;
  }

  /** Puts the caret at the end (used when the page around the editor is clicked). */
  focus(): void {
    if (this.disabled()) {
      return;
    }
    this.ensureCaretHost();
    placeCaretAtEnd(this.element);
  }

  // `input` and `paste` only fire while the element is editable, so they need no disabled check.
  protected onInput(): void {
    const plain = this.plainText();

    if (plain.length === 0 && this.element.textContent !== CARET_ZWSP) {
      writePlainText(this.element, '');
      placeCaretAtEnd(this.element);
    }

    const check = checkSegmentText(plain);
    if (!check.ok) {
      writePlainText(this.element, this.text());
      placeCaretAtOffset(this.element, check.caret);
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
    this.composing = true;
  }

  protected onCompositionEnd(): void {
    this.composing = false;
    this.onInput();
  }

  protected ensureCaretHost(): void {
    if (this.plainText().length === 0 && this.element.textContent !== CARET_ZWSP) {
      writePlainText(this.element, '');
    }
  }
}
