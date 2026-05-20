// src/components/StoryBookView.tsx

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useStory } from '../contexts/StoryContext';
import { Turn } from '../types/story.types';

const FONT_STORAGE_KEY = 'story-font';

const STORY_FONTS = {
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

type StoryFontId = keyof typeof STORY_FONTS;

function readStoredFontId(): StoryFontId {
  try {
    const raw = localStorage.getItem(FONT_STORAGE_KEY);
    if (raw && raw in STORY_FONTS) {
      return raw as StoryFontId;
    }
  } catch {
    /* ignore */
  }
  return 'sourceSerif';
}

export function StoryBookView() {
  const { currentStory, turns, isConnected, sendTurn } = useStory();

  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [fontId, setFontId] = useState<StoryFontId>(readStoredFontId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendDraftRef = useRef<() => Promise<void>>(async () => {});
  const enterHoldTimerRef = useRef<number | null>(null);

  const lastTurnContent = turns.length > 0 ? turns[turns.length - 1]!.content : '';
  const lastEndsWithNewline = /\r?\n\s*$/.test(lastTurnContent);
  const composerIsBlock = turns.length === 0 || lastEndsWithNewline;

  const fontStack = STORY_FONTS[fontId].stack;

  useEffect(() => {
    try {
      localStorage.setItem(FONT_STORAGE_KEY, fontId);
    } catch {
      /* ignore */
    }
  }, [fontId]);

  const turnsSignature = useMemo(() => {
    if (turns.length === 0) {
      return '';
    }
    const t = turns[turns.length - 1]!;
    return `${t.id}-${t.createdAt}-${t.editedAt ?? ''}`;
  }, [turns]);

  useEffect(() => {
    if (turnsSignature === '') {
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
  }, [turnsSignature]);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
    if (composerIsBlock) {
      el.style.width = '100%';
    } else {
      el.style.width = 'auto';
      el.style.width = `${Math.max(el.scrollWidth, 112)}px`;
    }
  }, [composerIsBlock]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [draft, turns.length, composerIsBlock, adjustTextareaHeight]);

  const sendDraft = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || !isConnected) {
      return;
    }

    setIsSending(true);
    try {
      await sendTurn(trimmed);
      setDraft('');
    } catch (error) {
      console.error('Failed to send turn:', error);
    } finally {
      setIsSending(false);
    }
  }, [draft, isConnected, sendTurn]);

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

      /* Suppress repeated newlines while holding Enter (used for ~3s “end turn” hold). */
      if (e.repeat) {
        e.preventDefault();
        return;
      }

      /* Shift+Enter stays a newline only (no hold-to-send timer — avoids noisy timers mid typing). */
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

  if (!currentStory) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-stone-100">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-200 bg-white/90 px-6 py-3 backdrop-blur-sm">
        <h2 className="truncate text-lg font-semibold text-stone-800">
          {currentStory.name}
        </h2>
        <label className="flex shrink-0 items-center gap-2 text-sm text-stone-600">
          <span className="hidden sm:inline">Font</span>
          <select
            value={fontId}
            onChange={(e) => setFontId(e.target.value as StoryFontId)}
            className="arounded-md corner-squircle max-w-[10.5rem] border border-stone-200 bg-white px-2 py-1 text-stone-800 focus:border-stone-400 focus:outline-none"
          >
            {(Object.keys(STORY_FONTS) as StoryFontId[]).map((id) => (
              <option key={id} value={id}>
                {STORY_FONTS[id].label}
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
          {turns.length === 0 && (
            <p className="mb-6 text-sm text-stone-500">
              No turns yet. Write the opening below.
              <span className="block pt-2 sm:inline sm:before:content-[' ']">
                Enter or Shift+Enter starts a new line. Hold plain Enter (~3&nbsp;s), or tap End turn,
                to finish yours.
              </span>
            </p>
          )}

          <div className="text-lg leading-[1.75] text-stone-900">
            {turns.map((turn) => (
              <TurnSpan key={turn.id} turn={turn} />
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
                isConnected ? 'Continue the story…' : 'Disconnected…'
              }
              disabled={!isConnected || isSending}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              onKeyUp={handleComposerKeyUp}
              onBlur={clearEnterHoldTimer}
              className={`max-w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-lg leading-[1.75] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                composerIsBlock ? 'block w-full align-top' : 'inline-block align-top'
              } `}
              aria-label="Story continuation"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-stone-200/80 pt-4 text-xs text-stone-500">
            <button
              type="button"
              disabled={!draft.trim() || !isConnected || isSending}
              onClick={() => void sendDraft()}
              className="arounded-md corner-squircle bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-900 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              End turn
            </button>
            <span className="hidden sm:inline">
              Shift+Enter = line break · Plain Enter holds = end (~3&nbsp;s), or tap End turn
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function trailingNewlineEndsContent(content: string): boolean {
  return /\r?\n\s*$/.test(content);
}

function TurnSpan({ turn }: { turn: Turn }) {
  const needsTrailingSpace = !trailingNewlineEndsContent(turn.content);

  return (
    <>
      <span className="whitespace-pre-wrap break-words">{turn.content}</span>
      {needsTrailingSpace ? <span className="inline"> </span> : null}
    </>
  );
}
