import { TestBed } from '@angular/core/testing';

import { NOTIFICATION_MS, Notifier } from './notifier';

describe('Notifier', () => {
  let notifier: Notifier;

  beforeEach(() => {
    vi.useFakeTimers();
    notifier = TestBed.inject(Notifier);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a notification and hides it after a while', () => {
    notifier.error('Could not send');
    expect(notifier.notifications()).toEqual([{ id: 1, kind: 'error', message: 'Could not send' }]);

    vi.advanceTimersByTime(NOTIFICATION_MS);
    expect(notifier.notifications()).toEqual([]);
  });

  it('dismisses a notification on request', () => {
    notifier.info('Saved');
    notifier.error('Failed');
    notifier.dismiss(1);
    expect(notifier.notifications().map((item) => item.message)).toEqual(['Failed']);
  });

  it('does not stack the same message', () => {
    notifier.error('Offline');
    notifier.error('Offline');
    expect(notifier.notifications()).toHaveLength(1);
  });
});
