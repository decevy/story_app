import {
  PassageSegmentInput,
  Seam,
} from '../core/models/story.types';
import { isSectionBreak } from './segment-visuals';

export type DraftSegment = {
  text: string;
  seamAfter?: Seam;
};

export type ComposerState = {
  segments: DraftSegment[];
  activeIndex: number;
  /** Break before the first draft segment. Overrides the previous passage while drafting. */
  seamBefore?: Seam;
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
    seamBefore: state.seamBefore,
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
  previousPassageLastSeam?: Seam,
): Seam | undefined {
  return state.seamBefore ?? previousPassageLastSeam;
}

export function applyEnter(
  state: ComposerState,
  previousPassageLastSeam?: Seam,
): ComposerState {
  const next = cloneComposer(state);
  const active = next.segments[next.activeIndex]!;

  if (active.text.length > 0) {
    const hasSegmentAfter = next.activeIndex < next.segments.length - 1;

    if (hasSegmentAfter) {
      if (active.seamAfter === Seam.Section) {
        insertEmptySegmentAfterActive(next);
      } else if (active.seamAfter === Seam.Paragraph) {
        active.seamAfter = Seam.Section;
      } else {
        active.seamAfter = Seam.Paragraph;
      }
    } else {
      active.seamAfter = Seam.Paragraph;
      insertEmptySegmentAfterActive(next);
    }
    return next;
  }

  // An empty first segment restyles in place. The break is stored on the
  // draft, ahead of the previous passage, so no extra empty segment is inserted.
  if (next.activeIndex === 0) {
    const leading = effectiveLeading(next, previousPassageLastSeam);
    if (isSectionBreak(leading)) {
      return state;
    }
    next.seamBefore =
      leading === Seam.Paragraph
        ? Seam.Section
        : Seam.Paragraph;
    return next;
  }

  // Otherwise, we're on an empty segment that isn't the first; look at the previous segment.
  const previous = next.segments[next.activeIndex - 1]!;

  // If the previous segment ended with a section break, do nothing:
  if (previous.seamAfter === Seam.Section) {
    return state;
  }

  // If the previous segment ended with a paragraph break, upgrade it to a section break:
  if (previous.seamAfter === Seam.Paragraph) {
    previous.seamAfter = Seam.Section;
    return next;
  }

  // If the previous segment had no seam or an unmarked seam,
  // set its seam to a section break as an implicit action
  previous.seamAfter = Seam.Section;
  return next;
}

export function applyBackspace(
  state: ComposerState,
  previousPassageLastSeam?: Seam,
): BackspaceResult {
  const active = state.segments[state.activeIndex]!;

  if (active.text.length > 0) {
    return { type: 'deleteChar' };
  }

  if (state.activeIndex === 0) {
    if (state.seamBefore == null) {
      return { type: 'noop' };
    }

    const next = cloneComposer(state);
    if (isSectionBreak(next.seamBefore)) {
      next.seamBefore = Seam.Paragraph;
    } else {
      delete next.seamBefore;
    }
    if (next.seamBefore === previousPassageLastSeam) {
      delete next.seamBefore;
    }
    return { type: 'structural', state: next };
  }

  const next = cloneComposer(state);
  const previous = next.segments[next.activeIndex - 1]!;

  if (previous.seamAfter === Seam.Section) {
    previous.seamAfter = Seam.Paragraph;
    return { type: 'structural', state: next };
  }

  next.segments.splice(next.activeIndex, 1);
  next.activeIndex -= 1;
  delete previous.seamAfter;
  return { type: 'structural', state: next };
}

export function toSegmentInputs(state: ComposerState): PassageSegmentInput[] {
  const segments = cloneComposer(state).segments;

  while (segments.length > 1 && segments[segments.length - 1]!.text.trim() === '') {
    segments.pop();
    if (segments.length > 0) {
      delete segments[segments.length - 1]!.seamAfter;
    }
  }

  const last = segments[segments.length - 1];
  if (last != null && last.text.length > 0 && !/\s$/.test(last.text)) {
    last.text = `${last.text} `;
  }

  return segments.map((segment, index) => ({
    order: index,
    text: segment.text,
    seamAfter: segment.seamAfter,
  }));
}
