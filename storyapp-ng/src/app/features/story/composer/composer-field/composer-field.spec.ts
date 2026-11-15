import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { CARET_ZWSP } from '../composer-dom';
import type { SegmentStartVisual } from '../segment-visuals';
import { ComposerField } from './composer-field';

@Component({
  imports: [ComposerField],
  template: `<sa-composer-field
    [text]="text()"
    [version]="version()"
    [startVisual]="startVisual()"
    [isActive]="isActive()"
    [disabled]="disabled()"
    (textChange)="events.push(['textChange', $event])"
    (focused)="events.push(['focused'])"
    (blurred)="events.push(['blurred'])"
    (enter)="events.push(['enter', $event])"
    (backspace)="events.push(['backspace', $event])"
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
    it('is an editable textbox', () => {
      expect(editable.getAttribute('contenteditable')).toBe('true');
      expect(editable.getAttribute('tabindex')).toBe('0');
      expect(editable.getAttribute('aria-label')).toBe('Story continuation');
      expect(editable.classList).toContain('cursor-text');
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
      expect(editable.classList).toContain('story-composer');
      expect(editable.classList).toContain('inline');
      expect(editable.classList).not.toContain('inline-block');
      expect(editable.getAttribute('aria-multiline')).toBe('false');

      host.startVisual.set('plainAlinea');
      await render();
      expect(editable.classList).toContain('w-full');
      expect(editable.classList).not.toContain('inline');
      expect(editable.classList).toContain('story-composer');
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
    function key(type: 'keydown' | 'keyup', key: string, init: KeyboardEventInit = {}) {
      const event = new KeyboardEvent(type, { key, cancelable: true, ...init });
      editable.dispatchEvent(event);
      return event;
    }

    it('reports Enter as press and release, with the text at release', () => {
      editable.textContent = 'Line';
      const down = key('keydown', 'Enter');
      key('keyup', 'Enter');
      expect(down.defaultPrevented).toBe(true);
      expect(host.events).toEqual([
        ['enter', { phase: 'press' }],
        ['enter', { phase: 'release', text: 'Line' }],
      ]);
    });

    it('releases Enter with the text from the press when the field emptied', () => {
      editable.textContent = 'Captured';
      key('keydown', 'Enter');
      editable.textContent = '';
      key('keyup', 'Enter');
      expect(host.events).toContainEqual(['enter', { phase: 'release', text: 'Captured' }]);
    });

    it('never inserts a line break, but reports a repeated Enter only once', () => {
      key('keydown', 'Enter');
      const repeat = key('keydown', 'Enter', { repeat: true });
      expect(repeat.defaultPrevented).toBe(true);
      expect(host.events).toEqual([['enter', { phase: 'press' }]]);
    });

    it('leaves Enter and Backspace with a modifier to the browser', () => {
      const enter = key('keydown', 'Enter', { ctrlKey: true });
      const backspace = key('keydown', 'Backspace', { altKey: true });
      expect(enter.defaultPrevented).toBe(false);
      expect(backspace.defaultPrevented).toBe(false);
      expect(host.events).toEqual([]);
    });

    it('lets the browser delete characters while the field has text', () => {
      editable.textContent = 'Hello';
      const down = key('keydown', 'Backspace');
      key('keyup', 'Backspace');
      expect(down.defaultPrevented).toBe(false);
      expect(host.events).toEqual([
        ['backspace', 'press'],
        ['backspace', 'release'],
      ]);
    });

    it('prevents Backspace in an empty field and while it repeats', () => {
      const empty = key('keydown', 'Backspace');
      expect(empty.defaultPrevented).toBe(true);

      editable.textContent = 'Hello';
      const repeat = key('keydown', 'Backspace', { repeat: true });
      expect(repeat.defaultPrevented).toBe(true);
      expect(host.events).toEqual([['backspace', 'press']]);
    });

    it('ignores other keys', () => {
      key('keydown', 'a');
      key('keyup', 'a');
      expect(host.events).toEqual([]);
    });

    it('ignores keys during IME composition and reads the text when it ends', () => {
      editable.dispatchEvent(new CompositionEvent('compositionstart'));
      key('keydown', 'Enter');
      key('keyup', 'Enter');
      expect(host.events).toEqual([]);

      editable.textContent = 'かな';
      editable.dispatchEvent(new CompositionEvent('compositionend'));
      expect(host.events).toEqual([['textChange', 'かな']]);
    });

    it('reports focus and blur', () => {
      editable.dispatchEvent(new FocusEvent('focus'));
      editable.dispatchEvent(new FocusEvent('blur'));
      expect(host.events).toEqual([['focused'], ['blurred']]);
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

// Own block: animation frames are faked before the first render, so no real frame from an
// earlier render can focus the field halfway through the test.
describe('ComposerField deferred focus', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function renderHost() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const editable = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[role="textbox"]',
    )!;
    return { fixture, editable };
  }

  it('focuses the active field on the next frame', async () => {
    const { editable } = await renderHost();
    vi.runAllTimers();
    expect(document.activeElement).toBe(editable);
  });

  it('does not focus a field that was disabled before that frame', async () => {
    const { fixture, editable } = await renderHost();
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    vi.runAllTimers();
    expect(document.activeElement).not.toBe(editable);
  });
});
