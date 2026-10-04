import {
  getSegmentStartVisual,
  segmentLayoutClass,
  type SegmentStartVisual,
} from './segmentVisuals';
import { Beat, BeatTransition, sortedBeatSegments } from '../types/pulse.types';

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

export function BeatSpan({
  beat,
  priorBeatLastTransition,
}: {
  beat: Beat;
  priorBeatLastTransition?: BeatTransition;
}) {
  const segments = sortedBeatSegments(beat);

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
                ? (beat.transitionOverride ?? priorBeatLastTransition)
                : undefined,
            )}
          />
        </span>
      ))}
    </>
  );
}
