import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { CARET_ZWSP } from './composer-dom';
import { PlainTextEditable } from './plain-text-editable';

@Component({
  imports: [PlainTextEditable],
  template: `<span
    saPlainTextEditable
    [text]="text()"
    [version]="version()"
    [active]="active()"
    [disabled]="disabled()"
    (textChange)="changes.push($event)"
  ></span>`,
})
class Host {
  readonly text = signal('');
  readonly version = signal(0);
  readonly active = signal(true);
  readonly disabled = signal(false);
  readonly changes: string[] = [];
  readonly editor = viewChild.required(PlainTextEditable);
}

describe('PlainTextEditable', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let element: HTMLSpanElement;
  let execCommand: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    execCommand = vi.fn();
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    element = fixture.nativeElement.querySelector('span');
  });

  async function render(): Promise<void> {
    await fixture.whenStable();
  }

  function input(text: string): void {
    element.textContent = text;
    element.dispatchEvent(new Event('input'));
  }

  describe('rendering', () => {
    it('is editable and focusable', () => {
      expect(element.getAttribute('contenteditable')).toBe('true');
      expect(element.getAttribute('tabindex')).toBe('0');
      expect(element.getAttribute('aria-disabled')).toBe('false');
      expect(element.getAttribute('spellcheck')).toBe('true');
    });

    it('is not editable or focusable while disabled', async () => {
      host.disabled.set(true);
      await render();
      expect(element.getAttribute('contenteditable')).toBe('false');
      expect(element.getAttribute('tabindex')).toBe('-1');
      expect(element.getAttribute('aria-disabled')).toBe('true');
    });

    it('holds a zero-width caret host while empty', () => {
      expect(element.textContent).toBe(CARET_ZWSP);
    });

    it('rewrites the DOM text when the version changes, not on every text change', async () => {
      host.text.set('Typed');
      await render();
      expect(element.textContent).toBe(CARET_ZWSP);

      host.version.set(1);
      await render();
      expect(element.textContent).toBe('Typed');
    });
  });

  describe('typing', () => {
    it('emits the plain text without caret hosts or non-breaking spaces', () => {
      input(`${CARET_ZWSP}Hello\u00a0world`);
      expect(host.changes).toEqual(['Hello world']);
      expect(host.editor().plainText()).toBe('Hello world');
    });

    it('puts the caret host back when the text is deleted', () => {
      input('');
      expect(element.textContent).toBe(CARET_ZWSP);
      expect(host.changes).toEqual(['']);
    });

    it('rejects adjacent whitespace and restores the previous text', async () => {
      host.text.set('Hello ');
      await render();
      input('Hello  ');
      expect(host.changes).toEqual([]);
      expect(element.textContent).toBe('Hello ');
      expect(document.getSelection()!.anchorOffset).toBe(6);
    });

    it('pastes plain text as a single line', () => {
      const paste = new Event('paste', { cancelable: true }) as ClipboardEvent;
      Object.defineProperty(paste, 'clipboardData', {
        value: { getData: () => 'one\r\ntwo\u00a0three' },
      });
      element.dispatchEvent(paste);

      expect(paste.defaultPrevented).toBe(true);
      expect(execCommand).toHaveBeenCalledWith('insertText', false, 'onetwo three');
    });

    it('ignores an empty paste', () => {
      const paste = new Event('paste', { cancelable: true }) as ClipboardEvent;
      element.dispatchEvent(paste);
      expect(paste.defaultPrevented).toBe(true);
      expect(execCommand).not.toHaveBeenCalled();
    });

    it('reports composing during IME input and reads the text when it ends', () => {
      element.dispatchEvent(new CompositionEvent('compositionstart'));
      expect(host.editor().isComposing()).toBe(true);

      element.textContent = 'かな';
      element.dispatchEvent(new CompositionEvent('compositionend'));
      expect(host.editor().isComposing()).toBe(false);
      expect(host.changes).toEqual(['かな']);
    });
  });

  describe('focus', () => {
    it('focus() puts the caret at the end', () => {
      element.textContent = 'End';
      host.editor().focus();
      const selection = document.getSelection()!;
      expect(document.activeElement).toBe(element);
      expect(selection.anchorNode).toBe(element.firstChild);
      expect(selection.anchorOffset).toBe(3);
    });

    it('focus() does nothing while disabled', async () => {
      host.disabled.set(true);
      await render();
      host.editor().focus();
      expect(document.activeElement).not.toBe(element);
    });

    it('restores the caret host on focus', () => {
      element.textContent = '';
      element.dispatchEvent(new FocusEvent('focus'));
      expect(element.textContent).toBe(CARET_ZWSP);
    });
  });
});

// Own block: animation frames are faked before the first render, so no real frame from an
// earlier render can focus the editor halfway through the test.
describe('PlainTextEditable deferred focus', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function renderHost() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = (fixture.nativeElement as HTMLElement).querySelector('span')!;
    return { fixture, element };
  }

  it('focuses the active editor on the next frame', async () => {
    const { element } = await renderHost();
    vi.runAllTimers();
    expect(document.activeElement).toBe(element);
  });

  it('does not focus an editor that was disabled before that frame', async () => {
    const { fixture, element } = await renderHost();
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    vi.runAllTimers();
    expect(document.activeElement).not.toBe(element);
  });

  it('does not focus an inactive editor', async () => {
    const { fixture, element } = await renderHost();
    fixture.componentInstance.active.set(false);
    await fixture.whenStable();
    vi.runAllTimers();
    expect(document.activeElement).not.toBe(element);
  });
});
