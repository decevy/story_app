import { Seam } from '@core/models/story';

import {
  applyBackspace,
  applyEnter,
  type ComposerState,
  createEmptyComposer,
  toSegmentInputs,
} from './passage-composer';

function state(partial: Partial<ComposerState> & Pick<ComposerState, 'segments'>): ComposerState {
  return { activeIndex: partial.segments.length - 1, ...partial };
}

describe('passage-composer', () => {
  describe('applyEnter', () => {
    it('ends a typed segment with a paragraph and opens a new empty segment', () => {
      const next = applyEnter(state({ segments: [{ text: 'Once' }] }));
      expect(next.segments).toEqual([{ text: 'Once', seamAfter: Seam.Paragraph }, { text: '' }]);
      expect(next.activeIndex).toBe(1);
    });

    it('upgrades the previous paragraph to a section on an empty segment', () => {
      const next = applyEnter(
        state({ segments: [{ text: 'Once', seamAfter: Seam.Paragraph }, { text: '' }] }),
      );
      expect(next.segments).toEqual([{ text: 'Once', seamAfter: Seam.Section }, { text: '' }]);
      expect(next.activeIndex).toBe(1);
    });

    it('ignores Enter in an empty section slot', () => {
      const current = state({
        segments: [{ text: 'Once', seamAfter: Seam.Section }, { text: '' }],
      });
      expect(applyEnter(current)).toBe(current);
    });

    it('marks an unmarked previous segment as a section', () => {
      const next = applyEnter(state({ segments: [{ text: 'Once' }, { text: '' }] }));
      expect(next.segments[0]!.seamAfter).toBe(Seam.Section);
    });

    it('cycles paragraph -> section -> new segment when a segment follows', () => {
      const base: ComposerState = { segments: [{ text: 'A' }, { text: 'B' }], activeIndex: 0 };
      const once = applyEnter(base);
      expect(once.segments[0]!.seamAfter).toBe(Seam.Paragraph);
      const twice = applyEnter(once);
      expect(twice.segments[0]!.seamAfter).toBe(Seam.Section);
      const thrice = applyEnter(twice);
      expect(thrice.segments.map((s) => s.text)).toEqual(['A', '', 'B']);
      expect(thrice.activeIndex).toBe(1);
    });

    it('stores breaks on an empty first segment as seamBefore', () => {
      const first = applyEnter(createEmptyComposer());
      expect(first.seamBefore).toBe(Seam.Paragraph);
      expect(first.segments).toEqual([{ text: '' }]);

      const second = applyEnter(first);
      expect(second.seamBefore).toBe(Seam.Section);

      expect(applyEnter(second)).toBe(second);
    });

    it('starts from the previous passage seam for an empty first segment', () => {
      expect(applyEnter(createEmptyComposer(), Seam.Paragraph).seamBefore).toBe(Seam.Section);
      const afterSection = createEmptyComposer();
      expect(applyEnter(afterSection, Seam.Chapter)).toBe(afterSection);
    });
  });

  describe('applyBackspace', () => {
    it('deletes characters while the active segment has text', () => {
      expect(applyBackspace(state({ segments: [{ text: 'a' }] }))).toEqual({ type: 'deleteChar' });
    });

    it('does nothing on an empty draft without seamBefore', () => {
      expect(applyBackspace(createEmptyComposer())).toEqual({ type: 'noop' });
    });

    it('unwinds seamBefore: section -> paragraph -> none', () => {
      const section = applyBackspace({ ...createEmptyComposer(), seamBefore: Seam.Section });
      expect(section.type).toBe('structural');
      const afterSection = (section as { state: ComposerState }).state;
      expect(afterSection.seamBefore).toBe(Seam.Paragraph);

      const paragraph = applyBackspace(afterSection);
      expect((paragraph as { state: ComposerState }).state.seamBefore).toBeUndefined();
    });

    it('drops seamBefore when it equals the previous passage seam', () => {
      const result = applyBackspace(
        { ...createEmptyComposer(), seamBefore: Seam.Section },
        Seam.Paragraph,
      );
      expect((result as { state: ComposerState }).state.seamBefore).toBeUndefined();
    });

    it('unwinds section -> paragraph -> merge into the previous segment', () => {
      const start = state({ segments: [{ text: 'Once', seamAfter: Seam.Section }, { text: '' }] });

      const toParagraph = applyBackspace(start);
      expect(toParagraph.type).toBe('structural');
      const paragraphState = (toParagraph as { state: ComposerState }).state;
      expect(paragraphState.segments[0]!.seamAfter).toBe(Seam.Paragraph);
      expect(paragraphState.segments).toHaveLength(2);

      const merged = applyBackspace(paragraphState);
      const mergedState = (merged as { state: ComposerState }).state;
      expect(mergedState.segments).toEqual([{ text: 'Once' }]);
      expect(mergedState.activeIndex).toBe(0);
    });
  });

  describe('toSegmentInputs', () => {
    it('trims trailing empty segments and the seam that led into them', () => {
      const inputs = toSegmentInputs(
        state({
          segments: [
            { text: 'One. ', seamAfter: Seam.Paragraph },
            { text: 'Two.', seamAfter: Seam.Section },
            { text: '' },
          ],
        }),
      );
      expect(inputs).toEqual([
        { order: 0, text: 'One. ', seamAfter: Seam.Paragraph },
        { order: 1, text: 'Two. ', seamAfter: undefined },
      ]);
    });

    it('adds a trailing space to the last segment only when missing', () => {
      expect(toSegmentInputs(state({ segments: [{ text: 'Hi' }] }))[0]!.text).toBe('Hi ');
      expect(toSegmentInputs(state({ segments: [{ text: 'Hi ' }] }))[0]!.text).toBe('Hi ');
    });

    it('does not mutate the composer state', () => {
      const current = state({ segments: [{ text: 'A', seamAfter: Seam.Paragraph }, { text: '' }] });
      toSegmentInputs(current);
      expect(current.segments).toEqual([{ text: 'A', seamAfter: Seam.Paragraph }, { text: '' }]);
    });
  });
});
