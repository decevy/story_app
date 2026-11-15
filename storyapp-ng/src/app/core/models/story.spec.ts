import { makePassage } from '@testing/fixtures';

import { lastPassageSeam, passageText, Seam, sortedPassageSegments } from './story';

describe('story helpers', () => {
  const passage = makePassage({
    segments: [
      { id: 2, order: 1, text: 'world. ', seamAfter: Seam.Section },
      { id: 1, order: 0, text: 'Hello ', seamAfter: Seam.Paragraph },
    ],
  });

  it('sorts segments by order', () => {
    expect(sortedPassageSegments(passage).map((segment) => segment.id)).toEqual([1, 2]);
  });

  it('joins the text in order', () => {
    expect(passageText(passage)).toBe('Hello world. ');
  });

  it('reads the seam after the last segment', () => {
    expect(lastPassageSeam(passage)).toBe(Seam.Section);
    expect(lastPassageSeam(makePassage({ segments: [] }))).toBeUndefined();
  });
});
