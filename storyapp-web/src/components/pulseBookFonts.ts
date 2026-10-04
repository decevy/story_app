export const FONT_STORAGE_KEY = 'pulse-font';

export const BOOK_FONTS = {
  inter: {
    label: 'Inter',
    stack: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  sourceSerif: {
    label: 'Source Serif 4',
    stack: "'Source Serif 4', ui-serif, Georgia, serif",
  },
  ebGaramond: {
    label: 'EB Garamond',
    stack: "'EB Garamond', ui-serif, Georgia, serif",
  },
  plexMono: {
    label: 'IBM Plex Mono',
    stack: "'IBM Plex Mono', ui-monospace, monospace",
  },
} as const;

export type BookFontId = keyof typeof BOOK_FONTS;

export function readStoredFontId(): BookFontId {
  try {
    const raw = localStorage.getItem(FONT_STORAGE_KEY);
    if (raw && raw in BOOK_FONTS) {
      return raw as BookFontId;
    }
    const legacyRaw = localStorage.getItem('story-font');
    if (legacyRaw && legacyRaw in BOOK_FONTS) {
      localStorage.removeItem('story-font');
      localStorage.setItem(FONT_STORAGE_KEY, legacyRaw);
      return legacyRaw as BookFontId;
    }
  } catch {
    /* ignore */
  }
  return 'sourceSerif';
}
