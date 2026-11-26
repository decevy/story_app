import { Seam } from '@core/models/story';

import { getSegmentStartVisual, type SegmentLike } from './segment-visuals';

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
