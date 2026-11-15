import { Component, computed, input } from '@angular/core';

import { getSegmentStartVisual, segmentLayoutClass } from '../composer/segment-visuals';
import { Passage, Seam, sortedPassageSegments } from '../core/models/story.types';

/** Port of storyapp-web/src/components/PassageSpan.tsx. */
@Component({
  selector: 'app-passage-span',
  host: { class: 'contents' },
  // One line per span on purpose: segment text renders with whitespace-pre-wrap.
  template: `
    @for (segment of segments(); track segment.id; let index = $index) {
      <span
        ><span class="break-words whitespace-pre-wrap {{ segmentClasses()[index] }}">{{
          segment.text
        }}</span></span
      >
    }
  `,
})
export class PassageSpan {
  readonly passage = input.required<Passage>();
  readonly previousPassageLastSeam = input<Seam | undefined>(undefined);

  protected readonly segments = computed(() => sortedPassageSegments(this.passage()));

  /** Layout class per segment; only the first one depends on the previous passage. */
  protected readonly segmentClasses = computed(() => {
    const segments = this.segments();
    const seamBefore = this.passage().seamBefore ?? this.previousPassageLastSeam();
    return segments.map((_, index) =>
      segmentLayoutClass(
        getSegmentStartVisual(segments, index, index === 0 ? seamBefore : undefined),
      ),
    );
  });
}
