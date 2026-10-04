import { SegmentLeadingBreak } from './SegmentLeadingBreak';
import {
  getSegmentStartVisual,
  segmentStartVisualIsBlock,
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
  const isBlock = segmentStartVisualIsBlock(startVisual);
  const indent = startVisual === 'indentedAlinea';

  return (
    <>
      <SegmentLeadingBreak visual={startVisual} />
      <span
        className={`break-words whitespace-pre-wrap ${
          indent ? 'block indent-[2em]' : isBlock ? 'block' : ''
        }`}
      >
        {text}
      </span>
    </>
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
              index === 0 ? priorBeatLastTransition : undefined,
            )}
          />
        </span>
      ))}
    </>
  );
}
