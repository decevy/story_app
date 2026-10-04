import { type SegmentStartVisual } from './segmentVisuals';

export function SegmentLeadingBreak({ visual }: { visual: SegmentStartVisual }) {
  if (visual !== 'afterSection') {
    return null;
  }
  return <span className="block h-[3.5em]" aria-hidden />;
}
