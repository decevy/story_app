import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type Passage, Seam } from '@core/models/story';
import { settle } from '@testing/helpers';

import { StoryStore } from '../data-access/story-store';
import { DraftStore } from './draft-store';
import { HOLD_MS } from './hold-timer';
import {
  applyBackspace,
  applyEnter,
  createEmptyComposer,
  toSegmentInputs,
} from './passage-composer';

function key(type: 'keydown' | 'keyup', key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent(type, { key, cancelable: true, ...init });
}

describe('DraftStore', () => {
  let hold: DraftStore;
  const isConnected = signal(true);
  const isSending = signal(false);
  const lastPassage = signal<Passage | null>(null);
  const sendPassage = vi.fn(async () => true);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    isConnected.set(true);
    isSending.set(false);
    lastPassage.set(null);
    sendPassage.mockReset().mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        DraftStore,
        { provide: StoryStore, useValue: { isConnected, isSending, lastPassage, sendPassage } },
      ],
    });
    hold = TestBed.inject(DraftStore);
  });

  afterEach(() => vi.useRealTimers());

  function type(text: string): void {
    hold.handleSegmentTextChange(hold.composer().activeIndex, text);
  }

  describe('state', () => {
    it('is disabled while disconnected or sending', () => {
      expect(hold.disabled()).toBe(false);
      isConnected.set(false);
      expect(hold.disabled()).toBe(true);
      isConnected.set(true);
      isSending.set(true);
      expect(hold.disabled()).toBe(true);
    });

    it('can send only with text and while enabled', () => {
      expect(hold.canSend()).toBe(false);
      type('Hello');
      expect(hold.canSend()).toBe(true);
      isConnected.set(false);
      expect(hold.canSend()).toBe(false);
    });

    it('takes the previous passage seam from the last passage', () => {
      lastPassage.set({
        segments: [{ id: 1, order: 0, text: 'x ', seamAfter: Seam.Section }],
      } as Passage);
      expect(hold.previousPassageLastSeam()).toBe(Seam.Section);
    });

    it('tracks text and focus per segment', () => {
      type('One');
      hold.handleSegmentFocus(0);
      expect(hold.composer().segments[0]!.text).toBe('One');
      expect(hold.composer().activeIndex).toBe(0);
    });
  });

  describe('Enter', () => {
    it('applies a structural Enter on a tap and rewrites the fields', () => {
      type('Hello');
      const before = hold.composer();
      const version = hold.draftVersion();

      const down = key('keydown', 'Enter');
      hold.handleComposerKeyDown(down);
      expect(down.defaultPrevented).toBe(true);
      hold.handleEnterTap('Hello');

      expect(hold.composer()).toEqual(applyEnter(before));
      expect(hold.draftVersion()).toBe(version + 1);
      expect(sendPassage).not.toHaveBeenCalled();
    });

    it('uses the stored text when the field reports none', () => {
      type('Stored');
      hold.handleComposerKeyDown(key('keydown', 'Enter'));
      hold.handleEnterTap('');
      expect(hold.composer().segments[0]!.text).toBe('Stored');
    });

    it('sends the draft when Enter is held, and resets it', async () => {
      type('Hello');
      const segments = toSegmentInputs(hold.composer());
      const version = hold.draftVersion();

      hold.handleComposerKeyDown(key('keydown', 'Enter'));
      vi.advanceTimersByTime(HOLD_MS / 2);
      expect(sendPassage).not.toHaveBeenCalled();

      vi.advanceTimersByTime(HOLD_MS);
      await settle(5);

      expect(sendPassage).toHaveBeenCalledWith(segments, undefined);
      expect(hold.composer()).toEqual(createEmptyComposer());
      expect(hold.draftVersion()).toBe(version + 1);

      // The key-up after the hold must not add a paragraph.
      hold.handleEnterTap('');
      expect(hold.composer()).toEqual(createEmptyComposer());
    });

    it('shifts the draft colour while Enter is held', () => {
      type('Hello');
      const resting = hold.draftColor();
      hold.handleComposerKeyDown(key('keydown', 'Enter'));
      vi.advanceTimersByTime(HOLD_MS / 2);
      expect(hold.draftColor()).not.toBe(resting);
      hold.clearHoldTimers();
      expect(hold.draftColor()).toBe(resting);
    });

    it('ignores repeats and modifier combinations', () => {
      type('Hello');
      const repeat = key('keydown', 'Enter', { repeat: true });
      hold.handleComposerKeyDown(repeat);
      expect(repeat.defaultPrevented).toBe(true);

      const withCtrl = key('keydown', 'Enter', { ctrlKey: true });
      hold.handleComposerKeyDown(withCtrl);
      expect(withCtrl.defaultPrevented).toBe(false);

      vi.advanceTimersByTime(HOLD_MS * 2);
      expect(sendPassage).not.toHaveBeenCalled();
    });
  });

  describe('sendDraft', () => {
    it('keeps the draft when the send is dropped or fails', async () => {
      sendPassage.mockResolvedValueOnce(false);
      type('Hello');
      await hold.sendDraft();
      expect(hold.composer().segments[0]!.text).toBe('Hello');
    });

    it('does nothing without text or while disconnected', async () => {
      await hold.sendDraft();
      type('Hello');
      isConnected.set(false);
      await hold.sendDraft();
      expect(sendPassage).not.toHaveBeenCalled();
    });

    it('passes seamBefore from the draft', async () => {
      hold.composer.set({ segments: [{ text: 'Hi' }], activeIndex: 0, seamBefore: Seam.Section });
      await hold.sendDraft();
      expect(sendPassage).toHaveBeenCalledWith(expect.any(Array), Seam.Section);
    });
  });

  describe('Backspace', () => {
    it('lets the browser delete characters while the segment has text', () => {
      type('Hello');
      const down = key('keydown', 'Backspace');
      hold.handleComposerKeyDown(down);
      expect(down.defaultPrevented).toBe(false);
      hold.handleComposerKeyUp(key('keyup', 'Backspace'));
      expect(hold.composer().segments[0]!.text).toBe('Hello');
    });

    it('applies a structural Backspace on an empty segment', () => {
      type('Hello');
      hold.handleComposerKeyDown(key('keydown', 'Enter'));
      hold.handleEnterTap('Hello');
      const before = hold.composer();
      const version = hold.draftVersion();

      const down = key('keydown', 'Backspace');
      hold.handleComposerKeyDown(down);
      expect(down.defaultPrevented).toBe(true);
      hold.handleComposerKeyUp(key('keyup', 'Backspace'));

      const expected = applyBackspace(before, undefined);
      expect(expected.type).toBe('structural');
      expect(hold.composer()).toEqual(expected.type === 'structural' ? expected.state : null);
      expect(hold.draftVersion()).toBe(version + 1);
    });

    it('clears the whole draft when Backspace is held', () => {
      type('Hello');
      hold.handleComposerKeyDown(key('keydown', 'Backspace'));
      vi.advanceTimersByTime(HOLD_MS + 50);
      expect(hold.composer()).toEqual(createEmptyComposer());

      // The key-up after the hold does nothing more.
      const version = hold.draftVersion();
      hold.handleComposerKeyUp(key('keyup', 'Backspace'));
      expect(hold.draftVersion()).toBe(version);
    });
  });
});
