import {
  getSegmentStartVisual,
  segmentLayoutClass,
  type SegmentStartVisual,
} from './segmentVisuals';
import { Passage, Seam, sortedPassageSegments } from '../types/story.types';

function SegmentText({
  text,
  startVisual,
}: {
  text: string;
  startVisual: SegmentStartVisual;
}) {
  return (
    <span
      className={`break-words whitespace-pre-wrap ${segmentLayoutClass(startVisual)}`}
    >
      {text}
    </span>
  );
}

export function PassageSpan({
  passage,
  previousPassageLastSeam,
}: {
  passage: Passage;
  previousPassageLastSeam?: Seam;
}) {
  const segments = sortedPassageSegments(passage);

  return (
    <>
      {segments.map((segment, index) => (
        <span key={segment.id}>
          <SegmentText
            text={segment.text}
            startVisual={getSegmentStartVisual(
              segments,
              index,
              index === 0
                ? (passage.seamBefore ?? previousPassageLastSeam)
                : undefined,
            )}
          />
        </span>
      ))}
    </>
  );
}
