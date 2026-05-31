// src/components/PulseView.tsx

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePulse } from '../contexts/PulseContext';
import { Beat } from '../types/pulse.types';

const FONT_STORAGE_KEY = 'pulse-font';

const BOOK_FONTS = {
  inter: {
    label: 'Inter',
    stack: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  sourceSerif: {
    label: 'Source Serif 4',
    stack: "'Source Serif 4', ui-serif, Georgia, serif",
  },
  ebGaramond: {
    label: 'EB Garamond',
    stack: "'EB Garamond', ui-serif, Georgia, serif",
  },
  plexMono: {
    label: 'IBM Plex Mono',
    stack: "'IBM Plex Mono', ui-monospace, monospace",
  },
} as const;

type BookFontId = keyof typeof BOOK_FONTS;

function readStoredFontId(): BookFontId {
  try {
    const raw = localStorage.getItem(FONT_STORAGE_KEY);
    if (raw && raw in BOOK_FONTS) {
      return raw as BookFontId;
    }
    const legacyRaw = localStorage.getItem('story-font');
    if (legacyRaw && legacyRaw in BOOK_FONTS) {
      localStorage.removeItem('story-font');
      localStorage.setItem(FONT_STORAGE_KEY, legacyRaw);
      return legacyRaw as BookFontId;
    }
  } catch {
    /* ignore */
  }
  return 'sourceSerif';
}

export function PulseView() {
  const { currentPulse, beats, isConnected, sendBeat } = usePulse();

  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [fontId, setFontId] = useState<BookFontId>(readStoredFontId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendDraftRef = useRef<() => Promise<void>>(async () => {});
  const enterHoldTimerRef = useRef<number | null>(null);

  const lastBeatPassage = beats.length > 0 ? beats[beats.length - 1]!.passage : '';
  const lastEndsWithNewline = /\r?\n\s*$/.test(lastBeatPassage);
  const composerIsBlock = beats.length === 0 || lastEndsWithNewline;
  /** Narrow inline textarea after prose looks fine for one soft line; hard breaks must span full inset. */
  const draftHasHardBreak = /\r?\n/.test(draft);
  const composerFullWidthLayout = composerIsBlock || draftHasHardBreak;

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

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
    if (composerFullWidthLayout) {
      el.style.width = '100%';
    } else {
      el.style.width = 'auto';
      el.style.width = `${Math.max(el.scrollWidth, 112)}px`;
    }
  }, [composerFullWidthLayout]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [draft, beats.length, composerFullWidthLayout, adjustTextareaHeight]);

  const sendDraft = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || !isConnected) {
      return;
    }

    setIsSending(true);
    try {
      await sendBeat(trimmed);
      setDraft('');
    } catch (error) {
      console.error('Failed to send beat:', error);
    } finally {
      setIsSending(false);
    }
  }, [draft, isConnected, sendBeat]);

  sendDraftRef.current = sendDraft;

  const clearEnterHoldTimer = useCallback(() => {
    if (enterHoldTimerRef.current !== null) {
      window.clearTimeout(enterHoldTimerRef.current);
      enterHoldTimerRef.current = null;
    }
  }, []);

  const scheduleSendAfterEnterHold = useCallback(() => {
    clearEnterHoldTimer();
    enterHoldTimerRef.current = window.setTimeout(() => {
      enterHoldTimerRef.current = null;
      void sendDraftRef.current();
    }, 3000);
  }, [clearEnterHoldTimer]);

  const handleComposerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter') {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (e.repeat) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        return;
      }

      scheduleSendAfterEnterHold();
    },
    [scheduleSendAfterEnterHold]
  );

  const handleComposerKeyUp = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter') {
        return;
      }
      clearEnterHoldTimer();
    },
    [clearEnterHoldTimer]
  );

  useEffect(() => {
    return () => clearEnterHoldTimer();
  }, [clearEnterHoldTimer]);

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
          className="mx-auto max-w-[42rem] bg-[#faf8f5] px-6 py-10 shadow-sm ring-1 ring-stone-200/60 min-[900px]:my-6 min-[900px]:min-h-[calc(100%-3rem)] min-[900px]:arounded-lg min-[900px]:corner-squircle"
          style={{ fontFamily: fontStack }}
        >
          {beats.length === 0 && (
            <p className="mb-6 text-sm text-stone-500">
              No beats yet. Write the opening below.
              <span className="block pt-2 sm:inline sm:before:content-[' ']">
                Enter or Shift+Enter starts a new line. Hold plain Enter (~3&nbsp;s), or tap End beat,
                to finish yours.
              </span>
            </p>
          )}

          <div className="text-lg leading-[1.75] text-stone-900">
            {beats.map((beat) => (
              <BeatSpan key={beat.id} beat={beat} />
            ))}
            <span
              ref={anchorRef}
              className="inline-block h-0 w-0 align-baseline"
              aria-hidden
            />
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={
                isConnected ? 'Continue the pulse…' : 'Disconnected…'
              }
              disabled={!isConnected || isSending}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              onKeyUp={handleComposerKeyUp}
              onBlur={clearEnterHoldTimer}
              className={`max-w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-lg leading-[1.75] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                composerFullWidthLayout ? 'block w-full align-top' : 'inline-block align-top'
              } `}
              aria-label="Pulse continuation"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-stone-200/80 pt-4 text-xs text-stone-500">
            <button
              type="button"
              disabled={!draft.trim() || !isConnected || isSending}
              onClick={() => void sendDraft()}
              className="arounded-md corner-squircle bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-900 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              End beat
            </button>
            <span className="hidden sm:inline">
              Shift+Enter = line break · Plain Enter holds = end (~3&nbsp;s), or tap End beat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function trailingNewlineEndsPassage(passage: string): boolean {
  return /\r?\n\s*$/.test(passage);
}

function BeatSpan({ beat }: { beat: Beat }) {
  const needsTrailingSpace = !trailingNewlineEndsPassage(beat.passage);

  return (
    <>
      <span className="whitespace-pre-wrap break-words">{beat.passage}</span>
      {needsTrailingSpace ? <span className="inline"> </span> : null}
    </>
  );
}
