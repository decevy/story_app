import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  applyBackspace,
  applyEnter,
  composerHasContent,
  createEmptyComposer,
  toSegmentInputs,
  setActiveSegmentIndex,
  updateActiveSegmentText,
  updateSegmentText,
  type ComposerState,
} from './beatComposer';

const HOLD_MS = 1500;

function randomDraftHue(): number {
  return Math.floor(Math.random() * 360);
}

function draftColorFromHue(hue: number, holdProgress: number): string {
  const shiftedHue = (hue + holdProgress * 360) % 360;
  return `hsl(${shiftedHue}, 70%, 42%)`;
}

type UseComposerHoldOptions = {
  composer: ComposerState;
  setComposer: React.Dispatch<React.SetStateAction<ComposerState>>;
  isConnected: boolean;
  sendBeat: (segments: ReturnType<typeof toSegmentInputs>) => Promise<void>;
  bumpSeed: () => void;
};

export function useComposerHold({
  composer,
  setComposer,
  isConnected,
  sendBeat,
  bumpSeed,
}: UseComposerHoldOptions) {
  const [isSending, setIsSending] = useState(false);
  const [draftHue, setDraftHue] = useState(randomDraftHue);
  const [enterHoldProgress, setEnterHoldProgress] = useState(0);

  const sendDraftRef = useRef<() => Promise<void>>(async () => {});
  const enterHoldStartRef = useRef<number | null>(null);
  const enterHoldRafRef = useRef<number | null>(null);
  const enterHoldSentRef = useRef(false);
  const backspaceHoldStartRef = useRef<number | null>(null);
  const backspaceHoldRafRef = useRef<number | null>(null);
  const backspaceHoldFiredRef = useRef(false);

  const draftColor = draftColorFromHue(draftHue, enterHoldProgress);

  const resetDraftAppearance = useCallback(() => {
    setDraftHue(randomDraftHue());
    setEnterHoldProgress(0);
  }, []);

  const stopEnterHold = useCallback(() => {
    if (enterHoldRafRef.current !== null) {
      cancelAnimationFrame(enterHoldRafRef.current);
      enterHoldRafRef.current = null;
    }
    enterHoldStartRef.current = null;
    setEnterHoldProgress(0);
  }, []);

  const stopBackspaceHold = useCallback(() => {
    if (backspaceHoldRafRef.current !== null) {
      cancelAnimationFrame(backspaceHoldRafRef.current);
      backspaceHoldRafRef.current = null;
    }
    backspaceHoldStartRef.current = null;
  }, []);

  const clearHoldTimers = useCallback(() => {
    stopEnterHold();
    stopBackspaceHold();
  }, [stopEnterHold, stopBackspaceHold]);

  const sendDraft = useCallback(async () => {
    if (!composerHasContent(composer) || !isConnected) {
      return;
    }

    const segments = toSegmentInputs(composer);
    if (segments.length === 0) {
      return;
    }

    setIsSending(true);
    try {
      await sendBeat(segments);
      setComposer(createEmptyComposer());
      resetDraftAppearance();
      bumpSeed();
    } catch (error) {
      console.error('Failed to send beat:', error);
    } finally {
      setIsSending(false);
    }
  }, [bumpSeed, composer, isConnected, resetDraftAppearance, sendBeat, setComposer]);

  sendDraftRef.current = sendDraft;

  const startEnterHold = useCallback(() => {
    stopEnterHold();
    enterHoldSentRef.current = false;
    enterHoldStartRef.current = performance.now();

    const tick = () => {
      const start = enterHoldStartRef.current;
      if (start === null) {
        return;
      }

      const progress = Math.min((performance.now() - start) / HOLD_MS, 1);
      setEnterHoldProgress(progress);

      if (progress >= 1) {
        enterHoldRafRef.current = null;
        if (!enterHoldSentRef.current) {
          enterHoldSentRef.current = true;
          void sendDraftRef.current();
        }
        return;
      }

      enterHoldRafRef.current = requestAnimationFrame(tick);
    };

    enterHoldRafRef.current = requestAnimationFrame(tick);
  }, [stopEnterHold]);

  const startBackspaceHold = useCallback(() => {
    stopBackspaceHold();
    backspaceHoldFiredRef.current = false;
    backspaceHoldStartRef.current = performance.now();

    const tick = () => {
      const start = backspaceHoldStartRef.current;
      if (start === null) {
        return;
      }

      const progress = Math.min((performance.now() - start) / HOLD_MS, 1);
      if (progress >= 1) {
        backspaceHoldRafRef.current = null;
        if (!backspaceHoldFiredRef.current) {
          backspaceHoldFiredRef.current = true;
          setComposer(createEmptyComposer());
          resetDraftAppearance();
          bumpSeed();
        }
        return;
      }

      backspaceHoldRafRef.current = requestAnimationFrame(tick);
    };

    backspaceHoldRafRef.current = requestAnimationFrame(tick);
  }, [bumpSeed, resetDraftAppearance, setComposer, stopBackspaceHold]);

  const canStructuralBackspace = useCallback((state: ComposerState) => {
    const active = state.segments[state.activeIndex];
    return active != null && active.text.length === 0 && state.activeIndex > 0;
  }, []);

  const handleComposerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLSpanElement>) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.repeat) {
          return;
        }
        startEnterHold();
        return;
      }

      if (event.key === 'Backspace') {
        if (event.repeat) {
          event.preventDefault();
          return;
        }
        startBackspaceHold();
        if (canStructuralBackspace(composer)) {
          event.preventDefault();
        }
      }
    },
    [composer, canStructuralBackspace, startBackspaceHold, startEnterHold],
  );

  const handleEnterTap = useCallback(
    (activeText: string) => {
      const sent = enterHoldSentRef.current;
      stopEnterHold();
      if (!sent) {
        setComposer((previous) => {
          const existing = previous.segments[previous.activeIndex]?.text ?? '';
          const textToApply = activeText.length > 0 ? activeText : existing;
          return applyEnter(updateActiveSegmentText(previous, textToApply));
        });
        bumpSeed();
      }
      enterHoldSentRef.current = false;
    },
    [bumpSeed, setComposer, stopEnterHold],
  );

  const handleComposerKeyUp = useCallback(
    (event: KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === 'Backspace') {
        const cleared = backspaceHoldFiredRef.current;
        stopBackspaceHold();
        if (cleared) {
          backspaceHoldFiredRef.current = false;
          return;
        }

        const result = applyBackspace(composer);
        if (result.type === 'structural') {
          setComposer(result.state);
          bumpSeed();
        }
        backspaceHoldFiredRef.current = false;
      }
    },
    [bumpSeed, composer, setComposer, stopBackspaceHold],
  );

  const handleSegmentTextChange = useCallback(
    (index: number, text: string) => {
      setComposer((previous) => updateSegmentText(previous, index, text));
    },
    [setComposer],
  );

  const handleSegmentFocus = useCallback(
    (index: number) => {
      setComposer((previous) => setActiveSegmentIndex(previous, index));
    },
    [setComposer],
  );

  useEffect(() => {
    return () => clearHoldTimers();
  }, [clearHoldTimers]);

  return {
    draftColor,
    clearHoldTimers,
    handleComposerKeyDown,
    handleEnterTap,
    handleComposerKeyUp,
    handleSegmentTextChange,
    handleSegmentFocus,
    isSending,
  };
}
