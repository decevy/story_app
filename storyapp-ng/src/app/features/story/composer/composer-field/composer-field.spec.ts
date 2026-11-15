import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

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

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    editable = fixture.nativeElement.querySelector('[role="textbox"]');
  });

  async function render(): Promise<void> {
    await fixture.whenStable();
  }

  describe('rendering', () => {
    it('is an editable textbox', () => {
      expect(editable.getAttribute('contenteditable')).toBe('true');
      expect(editable.getAttribute('tabindex')).toBe('0');
      expect(editable.getAttribute('aria-label')).toBe('Story continuation');
      expect(editable.classList).toContain('cursor-text');
    });

    it('is not editable while disabled', async () => {
      host.disabled.set(true);
      await render();
      expect(editable.getAttribute('contenteditable')).toBe('false');
      expect(editable.classList).not.toContain('cursor-text');
    });

    it('renders block starts as a full-width multiline field', async () => {
      expect(editable.classList).toContain('story-composer');
      expect(editable.classList).toContain('inline-block');
      expect(editable.getAttribute('aria-multiline')).toBe('false');

      // With text, an inline field wraps mid-line instead of moving as one box.
      host.text.set('Hello');
      await render();
      expect(editable.classList).toContain('inline');
      expect(editable.classList).not.toContain('inline-block');

      host.startVisual.set('plainAlinea');
      await render();
      expect(editable.classList).toContain('w-full');
      expect(editable.classList).not.toContain('inline');
      expect(editable.classList).toContain('story-composer');
      expect(editable.getAttribute('aria-multiline')).toBe('true');
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

    it('ignores keys during IME composition and passes the text on when it ends', () => {
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
