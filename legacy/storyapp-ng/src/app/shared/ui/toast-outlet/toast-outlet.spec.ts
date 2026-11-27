import { signal } from '@angular/core';
import { type Notification, Notifier } from '@core/notifications/notifier';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { ToastOutlet } from './toast-outlet';

describe('ToastOutlet', () => {
  it('shows errors as alerts and dismisses them', async () => {
    const notifications = signal<Notification[]>([
      { id: 1, kind: 'error', message: 'Could not send' },
      { id: 2, kind: 'info', message: 'Saved' },
    ]);
    const dismiss = vi.fn();
    await render(ToastOutlet, {
      providers: [{ provide: Notifier, useValue: { notifications, dismiss } }],
    });

    expect(screen.getByRole('alert').textContent).toContain('Could not send');
    expect(screen.getByRole('status').textContent).toContain('Saved');

    await userEvent.click(screen.getAllByRole('button', { name: 'Dismiss' })[0]!);
    expect(dismiss).toHaveBeenCalledWith(1);
  });
});
