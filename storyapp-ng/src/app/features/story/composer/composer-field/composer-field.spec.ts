import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CARET_ZWSP } from '../composer-dom';
import { type SegmentStartVisual } from '../segment-visuals';
import { ComposerField } from './composer-field';

@Component({
  imports: [ComposerField],
  template: `<app-composer-field
    [text]="text()"
    [version]="version()"
    [startVisual]="startVisual()"
    [isActive]="isActive()"
    [disabled]="disabled()"
    (textChange)="events.push(['textChange', $event])"
    (segmentFocus)="events.push(['segmentFocus'])"
    (enterTap)="events.push(['enterTap', $event])"
    (composerKeyDown)="events.push(['keydown', $event.key])"
    (composerKeyUp)="events.push(['keyup', $event.key])"
    (fieldBlur)="events.push(['fieldBlur'])"
  />`,
})
class Host {
  readonly text = signal('');
  readonly version = signal(0);
  readonly startVisual = signal<SegmentStartVisual>('inline');
  readonly isActive = signal(true);
  readonly disabled = signal(false);
  readonly events: unknown[][] = [];
  readonly field = viewChild.required(ComposerField);
}

describe('ComposerField', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let editable: HTMLSpanElement;
  let execCommand: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    execCommand = vi.fn();
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    editable = fixture.nativeElement.querySelector('[role="textbox"]');
  });

  async function render(): Promise<void> {
    await fixture.whenStable();
  }

  function input(text: string): void {
    editable.textContent = text;
    editable.dispatchEvent(new Event('input'));
  }

  describe('rendering', () => {
    it('is an editable textbox; the active one carries the test id', async () => {
      expect(editable.getAttribute('contenteditable')).toBe('true');
      expect(editable.getAttribute('tabindex')).toBe('0');
      expect(editable.getAttribute('data-testid')).toBe('composer-field');

      host.isActive.set(false);
      await render();
      expect(editable.hasAttribute('data-testid')).toBe(false);
    });

    it('is not editable or focusable while disabled', async () => {
      host.disabled.set(true);
      await render();
      expect(editable.getAttribute('contenteditable')).toBe('false');
      expect(editable.getAttribute('tabindex')).toBe('-1');
      expect(editable.getAttribute('aria-disabled')).toBe('true');
      expect(editable.classList).not.toContain('cursor-text');
    });

    it('renders block starts as a full-width multiline field', async () => {
      expect(editable.classList).toContain('inline-block');
      expect(editable.getAttribute('aria-multiline')).toBe('false');

      host.startVisual.set('plainAlinea');
      await render();
      expect(editable.classList).toContain('w-full');
      expect(editable.getAttribute('aria-multiline')).toBe('true');
    });

    it('holds a zero-width caret host while empty', () => {
      expect(editable.textContent).toBe(CARET_ZWSP);
    });

    it('rewrites the DOM text when the version changes, not on every text change', async () => {
      host.text.set('Typed');
      await render();
      expect(editable.textContent).toBe(CARET_ZWSP);

      host.version.set(1);
      await render();
      expect(editable.textContent).toBe('Typed');
    });
  });

  describe('typing', () => {
    it('emits the plain text without caret hosts or non-breaking spaces', () => {
      input(`${CARET_ZWSP}Hello\u00a0world`);
      expect(host.events).toContainEqual(['textChange', 'Hello world']);
    });

    it('rejects adjacent whitespace and restores the previous text', async () => {
      host.text.set('Hello ');
      await render();
      input('Hello  ');
      expect(host.events.filter(([name]) => name === 'textChange')).toEqual([]);
      expect(editable.textContent).toBe('Hello ');
    });

    it('ignores input while disabled', async () => {
      host.disabled.set(true);
      await render();
      input('Hello');
      expect(host.events).toEqual([]);
    });

    it('pastes plain text as a single line', () => {
      const paste = new Event('paste', { cancelable: true }) as ClipboardEvent;
      Object.defineProperty(paste, 'clipboardData', {
        value: { getData: () => 'one\r\ntwo\u00a0three' },
      });
      editable.dispatchEvent(paste);

      expect(paste.defaultPrevented).toBe(true);
      expect(execCommand).toHaveBeenCalledWith('insertText', false, 'onetwo three');
    });
  });

  describe('keys and focus', () => {
    it('reports Enter as a tap with the text in the field', () => {
      editable.textContent = 'Line';
      editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      editable.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      expect(host.events).toEqual([
        ['keydown', 'Enter'],
        ['enterTap', 'Line'],
      ]);
    });

    it('falls back to the text captured on keydown when the field emptied', () => {
      editable.textContent = 'Captured';
      editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      editable.textContent = '';
      editable.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      expect(host.events).toContainEqual(['enterTap', 'Captured']);
    });

    it('passes other keys through', () => {
      editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
      editable.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace' }));
      expect(host.events).toEqual([
        ['keydown', 'Backspace'],
        ['keyup', 'Backspace'],
      ]);
    });

    it('ignores keys during IME composition and reads the text when it ends', () => {
      editable.dispatchEvent(new CompositionEvent('compositionstart'));
      editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      editable.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      expect(host.events).toEqual([]);

      editable.textContent = 'かな';
      editable.dispatchEvent(new CompositionEvent('compositionend'));
      expect(host.events).toEqual([['textChange', 'かな']]);
    });

    it('reports focus and blur', () => {
      editable.dispatchEvent(new FocusEvent('focus'));
      editable.dispatchEvent(new FocusEvent('blur'));
      expect(host.events).toEqual([['segmentFocus'], ['fieldBlur']]);
    });

    it('focus() puts the caret at the end of the field', () => {
      editable.textContent = 'End';
      host.field().focus();
      const selection = document.getSelection()!;
      expect(document.activeElement).toBe(editable);
      expect(selection.anchorNode).toBe(editable.firstChild);
      expect(selection.anchorOffset).toBe(3);
    });
  });
});
