import { BeatTransition } from '../types/pulse.types';

export type SegmentStartVisual =
  | 'inline'
  | 'indentedAlinea'
  | 'plainAlinea'
  | 'afterSection';

export type SegmentLike = {
  transitionAfter?: BeatTransition;
};

export function isSectionBreak(transition?: BeatTransition): boolean {
  return (
    transition === BeatTransition.NewSection ||
    transition === BeatTransition.NewSectionMajor ||
    transition === BeatTransition.NewChapter
  );
}

function countParagraphsSinceSection(
  segments: SegmentLike[],
  fromIndex: number,
): number {
  let count = 0;
  for (let index = fromIndex; index >= 0; index -= 1) {
    const transition = segments[index]?.transitionAfter;
    if (isSectionBreak(transition)) {
      break;
    }
    if (transition === BeatTransition.NewParagraph) {
      count += 1;
    }
  }
  return count;
}

export function getSegmentStartVisual(
  segments: SegmentLike[],
  index: number,
  priorContext?: BeatTransition,
): SegmentStartVisual {
  if (index === 0) {
    if (isSectionBreak(priorContext)) {
      return 'afterSection';
    }
    if (priorContext === BeatTransition.NewParagraph) {
      return 'indentedAlinea';
    }
    return 'inline';
  }

  const breakBefore = segments[index - 1]?.transitionAfter;

  if (isSectionBreak(breakBefore)) {
    return 'afterSection';
  }

  if (breakBefore === BeatTransition.NewParagraph) {
    const paragraphCount = countParagraphsSinceSection(segments, index - 1);
    return paragraphCount === 1 ? 'indentedAlinea' : 'plainAlinea';
  }

  return 'inline';
}

export function segmentStartVisualIsBlock(visual: SegmentStartVisual): boolean {
  return visual !== 'inline';
}

export function segmentLayoutClass(visual: SegmentStartVisual): string {
  switch (visual) {
    case 'indentedAlinea':
      return 'block indent-[2em]';
    case 'plainAlinea':
      return 'block';
    case 'afterSection':
      return 'block w-full pt-[2lh]';
    case 'inline':
      return '';
  }
}
