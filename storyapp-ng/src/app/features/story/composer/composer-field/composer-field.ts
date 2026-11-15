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
  segmentLayoutClass,
  type SegmentStartVisual,
  segmentStartVisualIsBlock,
} from '../segment-visuals';

/**
 * One contentEditable segment of the draft. The host is `display: contents`, so the editable
 * span sits directly in the text flow.
 */
@Component({
  selector: 'sa-composer-field',
  host: {
    class: 'contents',
    '(mousedown)': 'onWrapperMouseDown($event)',
  },
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
  readonly segmentFocus = output();
  readonly enterTap = output<string>();
  readonly composerKeyDown = output<KeyboardEvent>();
  readonly composerKeyUp = output<KeyboardEvent>();
  readonly fieldBlur = output();

  private readonly editable = viewChild.required<ElementRef<HTMLSpanElement>>('editable');

  // Plain fields: IME / Enter bookkeeping is never rendered.
  private isComposing = false;
  private enterCapturedText: string | null = null;

  protected readonly isBlock = computed(() => segmentStartVisualIsBlock(this.startVisual()));
  protected readonly fieldClass = computed(
    () =>
      `story-composer break-words whitespace-pre-wrap ${segmentLayoutClass(this.startVisual())} ${
        this.isBlock()
          ? 'min-h-[1.75em] w-full'
          : 'inline-block min-h-[1.75em] min-w-[1ch] align-baseline'
      } ${this.disabled() ? '' : 'cursor-text'}`,
  );

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
    const element = this.editable().nativeElement;
    if (this.disabled()) {
      return;
    }
    this.ensureCaretHost();
    placeCaretAtEnd(element);
  }

  protected onInput(): void {
    const element = this.editable().nativeElement;
    if (this.disabled()) {
      return;
    }

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
    if (this.disabled()) {
      return;
    }

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
      this.enterCapturedText = readPlainText(this.editable().nativeElement);
    }
    this.composerKeyDown.emit(event);
  }

  protected onKeyUp(event: KeyboardEvent): void {
    if (this.isComposing || event.isComposing) {
      return;
    }
    if (event.key === 'Enter') {
      const domText = readPlainText(this.editable().nativeElement);
      const captured = this.enterCapturedText;
      const activeText =
        domText.length > 0 ? domText : captured && captured.length > 0 ? captured : this.text();
      this.enterCapturedText = null;
      this.enterTap.emit(activeText);
      return;
    }
    this.composerKeyUp.emit(event);
  }

  protected onFocus(): void {
    this.ensureCaretHost();
    this.segmentFocus.emit();
  }

  protected onWrapperMouseDown(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    if (event.target === this.editable().nativeElement) {
      return;
    }
    event.preventDefault();
    this.focus();
  }

  private ensureCaretHost(): void {
    const element = this.editable().nativeElement;
    if (readPlainText(element).length === 0 && element.textContent !== CARET_ZWSP) {
      writePlainText(element, '');
    }
  }
}
