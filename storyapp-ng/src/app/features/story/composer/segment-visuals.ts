import { Seam } from '../../../core/models/story';

export type SegmentStartVisual =
  | 'inline'
  | 'indentedAlinea'
  | 'plainAlinea'
  | 'afterSection';

export type SegmentLike = {
  seamAfter?: Seam;
};

export function isSectionBreak(seam?: Seam): boolean {
  return (
    seam === Seam.Section ||
    seam === Seam.MajorSection ||
    seam === Seam.Chapter
  );
}

function countParagraphsSinceSection(
  segments: SegmentLike[],
  fromIndex: number,
): number {
  let count = 0;
  for (let index = fromIndex; index >= 0; index -= 1) {
    const seam = segments[index]?.seamAfter;
    if (isSectionBreak(seam)) {
      break;
    }
    if (seam === Seam.Paragraph) {
      count += 1;
    }
  }
  return count;
}

export function getSegmentStartVisual(
  segments: SegmentLike[],
  index: number,
  previousPassageLastSeam?: Seam,
): SegmentStartVisual {
  if (index === 0) {
    if (isSectionBreak(previousPassageLastSeam)) {
      return 'afterSection';
    }
    if (previousPassageLastSeam === Seam.Paragraph) {
      return 'indentedAlinea';
    }
    return 'inline';
  }

  const breakBefore = segments[index - 1]?.seamAfter;

  if (isSectionBreak(breakBefore)) {
    return 'afterSection';
  }

  if (breakBefore === Seam.Paragraph) {
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
