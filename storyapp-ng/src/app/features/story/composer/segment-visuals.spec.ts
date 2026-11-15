import { Seam } from '@core/models/story';

import {
  composerFieldLayoutClass,
  getSegmentStartVisual,
  segmentLayoutClass,
  type SegmentLike,
} from './segment-visuals';

describe('getSegmentStartVisual', () => {
  const segments: SegmentLike[] = [
    { seamAfter: Seam.Inline },
    { seamAfter: Seam.Paragraph },
    { seamAfter: Seam.Paragraph },
    { seamAfter: Seam.Section },
    {},
  ];

  it('continues inline after an inline seam or at the start without context', () => {
    expect(getSegmentStartVisual(segments, 0)).toBe('inline');
    expect(getSegmentStartVisual(segments, 1)).toBe('inline');
  });

  it('indents the first paragraph in a section', () => {
    expect(getSegmentStartVisual(segments, 2)).toBe('indentedAlinea');
  });

  it('does not indent further paragraphs in the same section', () => {
    expect(getSegmentStartVisual(segments, 3)).toBe('plainAlinea');
  });

  it('adds the section gap after a section break', () => {
    expect(getSegmentStartVisual(segments, 4)).toBe('afterSection');
    expect(getSegmentStartVisual([{}], 0, Seam.MajorSection)).toBe('afterSection');
    expect(getSegmentStartVisual([{}], 0, Seam.Chapter)).toBe('afterSection');
  });

  it('uses the previous passage seam for the first segment', () => {
    expect(getSegmentStartVisual([{}], 0, Seam.Paragraph)).toBe('indentedAlinea');
    expect(getSegmentStartVisual([{}], 0, Seam.Inline)).toBe('inline');
  });

  // Known issue, kept as-is (see SPEC.md): paragraph counting only looks inside one
  // passage, so a passage that starts with a Paragraph seam is always indented, even
  // when it is not the first paragraph of its section.
  it.todo('carries paragraph counting across passages (a later paragraph should not be indented)');
});

describe('composerFieldLayoutClass', () => {
  it('keeps an inline field inline, so it wraps mid-line', () => {
    expect(composerFieldLayoutClass('inline')).toBe('inline');
  });

  it('makes a block start a full-width line, on top of its segment layout', () => {
    for (const visual of ['indentedAlinea', 'plainAlinea', 'afterSection'] as const) {
      const classes = composerFieldLayoutClass(visual).split(' ');
      expect(classes).toEqual(expect.arrayContaining(segmentLayoutClass(visual).split(' ')));
      expect(classes).toEqual(expect.arrayContaining(['w-full', 'min-h-[1.75em]']));
    }
  });
});
