import { BOOK_FONT_OPTIONS, isBookFontId } from './book-fonts';

describe('book fonts', () => {
  it('recognises font ids only', () => {
    expect(isBookFontId('ebGaramond')).toBe(true);
    expect(isBookFontId('comicSans')).toBe(false);
    expect(isBookFontId('toString')).toBe(false);
  });

  it('lists every font with its label', () => {
    expect(BOOK_FONT_OPTIONS.map((option) => option.id)).toEqual([
      'inter',
      'sourceSerif',
      'ebGaramond',
      'plexMono',
    ]);
    expect(BOOK_FONT_OPTIONS[0]).toEqual({ id: 'inter', label: 'Inter' });
  });
});
