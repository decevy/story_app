import { TestBed } from '@angular/core/testing';
import { type Passage, Seam } from '@core/models/story';
import { makePassage } from '@testing/fixtures';
import { hasClasses } from '@testing/helpers';

import { PassageSpan } from './passage-span';

function passage(overrides: Partial<Passage> = {}): Passage {
  return makePassage({
    segments: [
      // Deliberately out of order: rendering sorts by `order`.
      { id: 2, order: 1, text: 'second ', seamAfter: Seam.Section },
      { id: 1, order: 0, text: 'first ', seamAfter: Seam.Paragraph },
      { id: 3, order: 2, text: 'third ' },
    ],
    ...overrides,
  });
}

describe('PassageSpan', () => {
  async function render(value: Passage, previousPassageLastSeam?: Seam) {
    const fixture = TestBed.createComponent(PassageSpan);
    fixture.componentRef.setInput('passage', value);
    fixture.componentRef.setInput('previousPassageLastSeam', previousPassageLastSeam);
    await fixture.whenStable();
    const spans = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLSpanElement>('span > span'),
    ];
    return spans;
  }

  it('renders the segments in order', async () => {
    const spans = await render(passage());
    expect(spans.map((span) => span.textContent)).toEqual(['first ', 'second ', 'third ']);
  });

  it('lays out later segments from the seam before them', async () => {
    const [, second, third] = await render(passage());
    expect(hasClasses(second!, 'block indent-[2em]')).toBe(true); // after a paragraph
    expect(hasClasses(third!, 'block w-full pt-[2lh]')).toBe(true); // after a section
  });

  it('starts inline, or from the previous passage seam', async () => {
    expect((await render(passage()))[0]!.classList.contains('block')).toBe(false);
    expect(hasClasses((await render(passage(), Seam.Paragraph))[0]!, 'block indent-[2em]')).toBe(
      true,
    );
  });

  it("prefers the passage's own seamBefore over the previous passage", async () => {
    const [first] = await render(passage({ seamBefore: Seam.Chapter }), Seam.Paragraph);
    expect(hasClasses(first!, 'block w-full pt-[2lh]')).toBe(true);
  });
});
