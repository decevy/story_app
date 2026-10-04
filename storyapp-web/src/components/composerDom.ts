export const CARET_ZWSP = '\u200B';

export function readPlainText(element: HTMLElement): string {
  return (element.textContent ?? '')
    .replace(/\u200B/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r?\n/g, '');
}

export function writePlainText(element: HTMLElement, text: string) {
  element.textContent = text.length === 0 ? CARET_ZWSP : text;
}

export function placeCaretAtEnd(element: HTMLElement) {
  element.focus({ preventScroll: true });

  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const textNode = element.firstChild;
  if (textNode?.nodeType === Node.TEXT_NODE) {
    const length = textNode.textContent?.length ?? 0;
    const range = document.createRange();
    range.setStart(textNode, length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  writePlainText(element, readPlainText(element));
  const seeded = element.firstChild;
  if (seeded?.nodeType === Node.TEXT_NODE) {
    const length = seeded.textContent?.length ?? 0;
    const range = document.createRange();
    range.setStart(seeded, length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
