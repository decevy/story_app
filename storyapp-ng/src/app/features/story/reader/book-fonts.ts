/** localStorage key of the chosen book font (same as storyapp-web). */
export const FONT_STORAGE_KEY = 'book-font';

/** Fonts for the book page. The families are self-hosted (see `src/styles.css`). */
export const BOOK_FONTS = {
  inter: {
    label: 'Inter',
    stack: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
  },
  sourceSerif: {
    label: 'Source Serif 4',
    stack: "'Source Serif 4 Variable', ui-serif, Georgia, serif",
  },
  ebGaramond: {
    label: 'EB Garamond',
    stack: "'EB Garamond Variable', ui-serif, Georgia, serif",
  },
  plexMono: {
    label: 'IBM Plex Mono',
    stack: "'IBM Plex Mono', ui-monospace, monospace",
  },
} as const;

export type BookFontId = keyof typeof BOOK_FONTS;

export const DEFAULT_BOOK_FONT: BookFontId = 'sourceSerif';

/** The fonts as a list, in display order. */
export const BOOK_FONT_OPTIONS = (Object.keys(BOOK_FONTS) as BookFontId[]).map((id) => ({
  id,
  label: BOOK_FONTS[id].label,
}));

export function isBookFontId(value: string): value is BookFontId {
  return Object.hasOwn(BOOK_FONTS, value);
}
