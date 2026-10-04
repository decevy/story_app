// src/components/PulseView.tsx

import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePulse } from '../contexts/PulseContext';
import { createEmptyComposer, type ComposerState } from './beatComposer';
import { BeatSpan } from './BeatSpan';
import { ComposerField, type ComposerFieldHandle } from './ComposerField';
import { BOOK_FONTS, FONT_STORAGE_KEY, readStoredFontId, type BookFontId } from './pulseBookFonts';
import { getSegmentStartVisual } from './segmentVisuals';
import { useComposerHold } from './useComposerHold';
import { lastBeatSegmentTransition } from '../types/pulse.types';

export function PulseView() {
  const { currentPulse, beats, isConnected, sendBeat } = usePulse();

  const [composer, setComposer] = useState<ComposerState>(createEmptyComposer);
  const [fontId, setFontId] = useState<BookFontId>(readStoredFontId);
  const [seedToken, setSeedToken] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const composerFieldRef = useRef<ComposerFieldHandle>(null);

  const bumpSeed = useCallback(() => {
    setSeedToken((token) => token + 1);
  }, []);

  const lastBeat = beats.length > 0 ? beats[beats.length - 1]! : null;
  const priorBeatLastTransition =
    lastBeat != null ? lastBeatSegmentTransition(lastBeat) : undefined;

  const {
    draftColor,
    clearHoldTimers,
    handleComposerKeyDown,
    handleEnterTap,
    handleComposerKeyUp,
    handleSegmentTextChange,
    handleSegmentFocus,
    isSending,
  } = useComposerHold({
    composer,
    setComposer,
    isConnected,
    sendBeat,
    bumpSeed,
    priorBeatLastTransition,
  });

  const fontStack = BOOK_FONTS[fontId].stack;

  useEffect(() => {
    try {
      localStorage.setItem(FONT_STORAGE_KEY, fontId);
    } catch {
      /* ignore */
    }
  }, [fontId]);

  const beatsSignature = useMemo(() => {
    if (beats.length === 0) {
      return '';
    }
    const b = beats[beats.length - 1]!;
    return `${b.id}-${b.createdAt}-${b.editedAt ?? ''}`;
  }, [beats]);

  useEffect(() => {
    if (beatsSignature === '') {
      return;
    }
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled || !anchorRef.current) {
          return;
        }
        anchorRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [beatsSignature]);

  const composerDisabled = !isConnected || isSending;

  const focusComposer = useCallback(() => {
    if (composerDisabled) {
      return;
    }
    composerFieldRef.current?.focus();
  }, [composerDisabled]);

  const handleDraftZoneMouseDown = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      if (composerDisabled) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.closest('.pulse-composer')) {
        return;
      }
      if (target.closest('[data-draft-text]')) {
        return;
      }
      if (target.classList.contains('draft-zone-fill')) {
        return;
      }
      event.preventDefault();
      focusComposer();
    },
    [composerDisabled, focusComposer],
  );

  const handleDraftZoneFillMouseDown = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      if (composerDisabled) {
        return;
      }
      event.preventDefault();
      focusComposer();
    },
    [composerDisabled, focusComposer],
  );

  const handlePageMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (composerDisabled) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.closest('.pulse-composer')) {
        return;
      }
      event.preventDefault();
      focusComposer();
    },
    [composerDisabled, focusComposer],
  );

  if (!currentPulse) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-stone-100">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-200 bg-white/90 px-6 py-3 backdrop-blur-sm">
        <h2 className="truncate text-lg font-semibold text-stone-800">
          {currentPulse.name}
        </h2>
        <label className="flex shrink-0 items-center gap-2 text-sm text-stone-600">
          <span className="hidden sm:inline">Font</span>
          <select
            value={fontId}
            onChange={(e) => setFontId(e.target.value as BookFontId)}
            className="arounded-md corner-squircle max-w-[10.5rem] border border-stone-200 bg-white px-2 py-1 text-stone-800 focus:border-stone-400 focus:outline-none"
          >
            {(Object.keys(BOOK_FONTS) as BookFontId[]).map((id) => (
              <option key={id} value={id}>
                {BOOK_FONTS[id].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]"
      >
        <div
          className="mx-auto flex min-h-full cursor-text flex-col max-w-[42rem] bg-[#faf8f5] px-6 py-10 shadow-sm ring-1 ring-stone-200/60 min-[900px]:my-6 min-[900px]:min-h-[calc(100%-3rem)] min-[900px]:arounded-lg min-[900px]:corner-squircle"
          style={{ fontFamily: fontStack }}
          onMouseDown={handlePageMouseDown}
        >
          {beats.length === 0 && (
            <p className="mb-6 text-sm text-stone-500">
              No beats yet. Write the opening below.
            </p>
          )}

          <div className="flex min-h-[12rem] flex-1 flex-col items-stretch text-lg leading-[1.75]">
            <div
              className="draft-zone min-w-0 flex-1 cursor-text select-text text-stone-900"
              style={{ ['--draft-color' as string]: draftColor }}
              onMouseDown={handleDraftZoneMouseDown}
            >
              {beats.map((beat, beatIndex) => (
                <BeatSpan
                  key={beat.id}
                  beat={beat}
                  priorBeatLastTransition={
                    beatIndex > 0
                      ? lastBeatSegmentTransition(beats[beatIndex - 1]!)
                      : undefined
                  }
                />
              ))}
              {composer.segments.map((segment, index) => (
                <span key={`draft-${index}`} data-draft-text="">
                  <ComposerField
                    ref={
                      index === composer.activeIndex
                        ? composerFieldRef
                        : undefined
                    }
                    text={segment.text}
                    seedToken={seedToken}
                    startVisual={getSegmentStartVisual(
                      composer.segments,
                      index,
                      index === 0
                        ? (composer.leadingTransition ?? priorBeatLastTransition)
                        : undefined,
                    )}
                    isActive={index === composer.activeIndex}
                    disabled={composerDisabled}
                    onTextChange={(text) =>
                      handleSegmentTextChange(index, text)
                    }
                    onFocusSegment={() => handleSegmentFocus(index)}
                    onEnterTap={handleEnterTap}
                    onKeyDown={handleComposerKeyDown}
                    onKeyUp={handleComposerKeyUp}
                    onBlur={clearHoldTimers}
                  />
                </span>
              ))}
              <span
                ref={anchorRef}
                className="inline-block h-0 w-0 align-baseline"
                aria-hidden
              />
            </div>
            <span
              className="draft-zone-fill block min-h-[6rem] w-full flex-1 cursor-text"
              aria-hidden
              onMouseDown={handleDraftZoneFillMouseDown}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
