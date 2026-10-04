import {
  BeatSegmentInput,
  BeatTransition,
} from '../types/pulse.types';
import { isSectionBreak } from './segmentVisuals';

export type DraftSegment = {
  text: string;
  transitionAfter?: BeatTransition;
};

export type ComposerState = {
  segments: DraftSegment[];
  activeIndex: number;
  /** Break before the first draft segment. Overrides the previous beat while drafting. */
  leadingTransition?: BeatTransition;
};

export type BackspaceResult =
  | { type: 'structural'; state: ComposerState }
  | { type: 'deleteChar' }
  | { type: 'noop' };

export function createEmptyComposer(): ComposerState {
  return { segments: [{ text: '' }], activeIndex: 0 };
}

export function cloneComposer(state: ComposerState): ComposerState {
  return {
    activeIndex: state.activeIndex,
    leadingTransition: state.leadingTransition,
    segments: state.segments.map((segment) => ({ ...segment })),
  };
}

export function updateActiveSegmentText(
  state: ComposerState,
  text: string,
): ComposerState {
  return updateSegmentText(state, state.activeIndex, text);
}

export function updateSegmentText(
  state: ComposerState,
  index: number,
  text: string,
): ComposerState {
  const next = cloneComposer(state);
  next.segments[index]!.text = text;
  return next;
}

export function setActiveSegmentIndex(
  state: ComposerState,
  index: number,
): ComposerState {
  if (state.activeIndex === index) {
    return state;
  }
  return { ...state, activeIndex: index };
}

export function composerHasContent(state: ComposerState): boolean {
  return state.segments.some((segment) => segment.text.trim().length > 0);
}

function insertEmptySegmentAfterActive(composer: ComposerState): void {
  const insertAt = composer.activeIndex + 1;
  composer.segments.splice(insertAt, 0, { text: '' });
  composer.activeIndex = insertAt;
}

function effectiveLeading(
  state: ComposerState,
  priorContext?: BeatTransition,
): BeatTransition | undefined {
  return state.leadingTransition ?? priorContext;
}

export function applyEnter(
  state: ComposerState,
  priorContext?: BeatTransition,
): ComposerState {
  const next = cloneComposer(state);
  const active = next.segments[next.activeIndex]!;

  if (active.text.length > 0) {
    const hasSegmentAfter = next.activeIndex < next.segments.length - 1;

    if (hasSegmentAfter) {
      if (active.transitionAfter === BeatTransition.NewSection) {
        insertEmptySegmentAfterActive(next);
      } else if (active.transitionAfter === BeatTransition.NewParagraph) {
        active.transitionAfter = BeatTransition.NewSection;
      } else {
        active.transitionAfter = BeatTransition.NewParagraph;
      }
    } else {
      active.transitionAfter = BeatTransition.NewParagraph;
      insertEmptySegmentAfterActive(next);
    }
    return next;
  }

  // An empty first segment restyles in place. The break is stored on the
  // draft, ahead of the previous beat, so no extra empty segment is inserted.
  if (next.activeIndex === 0) {
    const leading = effectiveLeading(next, priorContext);
    if (isSectionBreak(leading)) {
      return state;
    }
    next.leadingTransition =
      leading === BeatTransition.NewParagraph
        ? BeatTransition.NewSection
        : BeatTransition.NewParagraph;
    return next;
  }

  // Otherwise, we're on an empty segment that isn't the first; look at the previous segment.
  const previous = next.segments[next.activeIndex - 1]!;

  // If the previous segment ended with a section break, do nothing:
  if (previous.transitionAfter === BeatTransition.NewSection) {
    return state;
  }

  // If the previous segment ended with a paragraph break, upgrade it to a section break:
  if (previous.transitionAfter === BeatTransition.NewParagraph) {
    previous.transitionAfter = BeatTransition.NewSection;
    return next;
  }

  // If the previous segment had no transition or an unmarked transition,
  // set its transition to a section break as an implicit action
  previous.transitionAfter = BeatTransition.NewSection;
  return next;
}

export function applyBackspace(
  state: ComposerState,
  priorContext?: BeatTransition,
): BackspaceResult {
  const active = state.segments[state.activeIndex]!;

  if (active.text.length > 0) {
    return { type: 'deleteChar' };
  }

  if (state.activeIndex === 0) {
    if (state.leadingTransition == null) {
      return { type: 'noop' };
    }

    const next = cloneComposer(state);
    if (isSectionBreak(next.leadingTransition)) {
      next.leadingTransition = BeatTransition.NewParagraph;
    } else {
      delete next.leadingTransition;
    }
    if (next.leadingTransition === priorContext) {
      delete next.leadingTransition;
    }
    return { type: 'structural', state: next };
  }

  const next = cloneComposer(state);
  const previous = next.segments[next.activeIndex - 1]!;

  if (previous.transitionAfter === BeatTransition.NewSection) {
    previous.transitionAfter = BeatTransition.NewParagraph;
    return { type: 'structural', state: next };
  }

  next.segments.splice(next.activeIndex, 1);
  next.activeIndex -= 1;
  delete previous.transitionAfter;
  return { type: 'structural', state: next };
}

export function toSegmentInputs(state: ComposerState): BeatSegmentInput[] {
  const segments = cloneComposer(state).segments;

  while (segments.length > 1 && segments[segments.length - 1]!.text.trim() === '') {
    segments.pop();
    if (segments.length > 0) {
      delete segments[segments.length - 1]!.transitionAfter;
    }
  }

  const last = segments[segments.length - 1];
  if (last != null && last.text.length > 0 && !/\s$/.test(last.text)) {
    last.text = `${last.text} `;
  }

  return segments.map((segment, index) => ({
    order: index,
    text: segment.text,
    transitionAfter: segment.transitionAfter,
  }));
}
