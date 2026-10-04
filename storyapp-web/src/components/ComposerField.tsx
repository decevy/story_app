import {
  ClipboardEvent,
  KeyboardEvent,
  MouseEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  CARET_ZWSP,
  hasAdjacentWhitespace,
  placeCaretAtEnd,
  placeCaretAtOffset,
  readPlainText,
  writePlainText,
} from './composerDom';
import { SegmentLeadingBreak } from './SegmentLeadingBreak';
import {
  segmentStartVisualIsBlock,
  type SegmentStartVisual,
} from './segmentVisuals';

export type ComposerFieldHandle = {
  focus: () => void;
};

export type ComposerFieldProps = {
  text: string;
  seedToken: number;
  startVisual: SegmentStartVisual;
  isActive: boolean;
  disabled: boolean;
  onTextChange: (text: string) => void;
  onFocusSegment: () => void;
  onEnterTap: (activeText: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLSpanElement>) => void;
  onKeyUp: (event: KeyboardEvent<HTMLSpanElement>) => void;
  onBlur: () => void;
};

export const ComposerField = forwardRef<ComposerFieldHandle, ComposerFieldProps>(
  function ComposerField(
    {
      text,
      seedToken,
      startVisual,
      isActive,
      disabled,
      onTextChange,
      onFocusSegment,
      onEnterTap,
      onKeyDown,
      onKeyUp,
      onBlur,
    },
    ref,
  ) {
    const editableRef = useRef<HTMLSpanElement>(null);
    const isComposingRef = useRef(false);
    const enterCapturedTextRef = useRef<string | null>(null);
    const textRef = useRef(text);
    textRef.current = text;
    const isBlock = segmentStartVisualIsBlock(startVisual);
    const indent = startVisual === 'indentedAlinea';

    const ensureCaretHost = useCallback(() => {
      const element = editableRef.current;
      if (!element) {
        return;
      }
      if (readPlainText(element).length === 0 && element.textContent !== CARET_ZWSP) {
        writePlainText(element, '');
      }
    }, []);

    const focusComposer = useCallback(() => {
      const element = editableRef.current;
      if (!element || disabled) {
        return;
      }
      ensureCaretHost();
      placeCaretAtEnd(element);
    }, [disabled, ensureCaretHost]);

    useImperativeHandle(ref, () => ({ focus: focusComposer }), [focusComposer]);

    useEffect(() => {
      const element = editableRef.current;
      if (!element) {
        return;
      }
      writePlainText(element, textRef.current);
      if (!disabled && isActive) {
        requestAnimationFrame(() => {
          const node = editableRef.current;
          if (node && document.activeElement !== node) {
            node.focus({ preventScroll: true });
          }
          if (node) {
            placeCaretAtEnd(node);
          }
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seedToken, disabled]);

    useEffect(() => {
      const element = editableRef.current;
      if (!element || disabled || !isActive) {
        return;
      }

      const restoreCaretIfLost = () => {
        if (isComposingRef.current || document.activeElement !== element) {
          return;
        }
        const selection = window.getSelection();
        if (
          !selection ||
          selection.rangeCount === 0 ||
          !element.contains(selection.anchorNode)
        ) {
          ensureCaretHost();
          placeCaretAtEnd(element);
        }
      };

      document.addEventListener('selectionchange', restoreCaretIfLost);
      return () => document.removeEventListener('selectionchange', restoreCaretIfLost);
    }, [disabled, isActive, ensureCaretHost]);

    const handleInput = useCallback(() => {
      const element = editableRef.current;
      if (!element || disabled) {
        return;
      }

      const previous = textRef.current;
      const plain = readPlainText(element);

      if (plain.length === 0 && element.textContent !== CARET_ZWSP) {
        writePlainText(element, '');
        placeCaretAtEnd(element);
      }

      if (hasAdjacentWhitespace(plain)) {
        writePlainText(element, previous);
        const duplicateAt = plain.search(/\s{2,}/);
        placeCaretAtOffset(
          element,
          duplicateAt >= 0 ? duplicateAt + 1 : previous.length,
        );
        return;
      }

      onTextChange(plain);
    }, [disabled, onTextChange]);

    const handlePaste = useCallback(
      (event: ClipboardEvent<HTMLSpanElement>) => {
        event.preventDefault();
        if (disabled) {
          return;
        }

        const pasted = (event.clipboardData?.getData('text/plain') ?? '')
          .replace(/\r?\n/g, '')
          .replace(/\u00a0/g, ' ');

        if (pasted.length === 0) {
          return;
        }

        document.execCommand('insertText', false, pasted);
        handleInput();
      },
      [disabled, handleInput],
    );

    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(() => {
      isComposingRef.current = false;
      handleInput();
    }, [handleInput]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLSpanElement>) => {
        if (isComposingRef.current || event.nativeEvent.isComposing) {
          return;
        }
        if (event.key === 'Enter' && !event.repeat) {
          const element = editableRef.current;
          enterCapturedTextRef.current = element
            ? readPlainText(element)
            : textRef.current;
        }
        onKeyDown(event);
      },
      [onKeyDown],
    );

    const handleKeyUp = useCallback(
      (event: KeyboardEvent<HTMLSpanElement>) => {
        if (isComposingRef.current || event.nativeEvent.isComposing) {
          return;
        }
        if (event.key === 'Enter') {
          const element = editableRef.current;
          const domText = element ? readPlainText(element) : '';
          const captured = enterCapturedTextRef.current;
          const activeText =
            domText.length > 0
              ? domText
              : captured && captured.length > 0
                ? captured
                : textRef.current;
          enterCapturedTextRef.current = null;
          onEnterTap(activeText);
          return;
        }
        onKeyUp(event);
      },
      [onEnterTap, onKeyUp],
    );

    const handleFocus = useCallback(() => {
      ensureCaretHost();
      onFocusSegment();
    }, [ensureCaretHost, onFocusSegment]);

    const handleWrapperMouseDown = useCallback(
      (event: MouseEvent<HTMLSpanElement>) => {
        if (disabled) {
          return;
        }
        if (event.target === editableRef.current) {
          return;
        }
        event.preventDefault();
        focusComposer();
      },
      [disabled, focusComposer],
    );

    return (
      <span className="contents" onMouseDown={handleWrapperMouseDown}>
        <SegmentLeadingBreak visual={startVisual} />
        <span
          ref={editableRef}
          role="textbox"
          aria-label="Pulse continuation"
          aria-multiline={isBlock}
          aria-disabled={disabled}
          contentEditable={disabled ? false : true}
          suppressContentEditableWarning
          spellCheck
          tabIndex={disabled ? -1 : 0}
          onInput={handleInput}
          onPaste={handlePaste}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onFocus={handleFocus}
          onBlur={onBlur}
          className={`pulse-composer break-words whitespace-pre-wrap ${
            indent
              ? 'block min-h-[1.75em] w-full indent-[2em]'
              : isBlock
                ? 'block min-h-[1.75em] w-full'
                : 'inline-block min-h-[1.75em] min-w-[1ch] align-baseline'
          } ${disabled ? '' : 'cursor-text'}`}
        />
      </span>
    );
  },
);
