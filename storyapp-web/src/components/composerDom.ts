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

export function hasAdjacentWhitespace(text: string): boolean {
  return /\s{2,}/.test(text);
}

export function placeCaretAtOffset(element: HTMLElement, offset: number) {
  element.focus({ preventScroll: true });

  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const plain = readPlainText(element);
  const caretOffset = Math.max(0, Math.min(offset, plain.length));

  let textNode = element.firstChild;
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
    writePlainText(element, plain);
    textNode = element.firstChild;
  }
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
    return;
  }

  const nodeLength = textNode.textContent?.length ?? 0;
  const nodeOffset =
    plain.length === 0 && nodeLength === 1 ? 0 : Math.min(caretOffset, nodeLength);

  const range = document.createRange();
  range.setStart(textNode, nodeOffset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function placeCaretAtEnd(element: HTMLElement) {
  placeCaretAtOffset(element, readPlainText(element).length);
}
