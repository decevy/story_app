import { DestroyRef, inject, Injectable, signal } from '@angular/core';

export type NotificationKind = 'error' | 'info';

export interface Notification {
  id: number;
  kind: NotificationKind;
  message: string;
}

/** How long a notification stays on screen. */
export const NOTIFICATION_MS = 6000;

/** App-wide toast messages; rendered by `<sa-toast-outlet>` in the root component. */
@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly items = signal<Notification[]>([]);
  readonly notifications = this.items.asReadonly();

  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.timers.forEach((timer) => {
        clearTimeout(timer);
      });
      this.timers.clear();
    });
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  private show(kind: NotificationKind, message: string): void {
    // The same message twice in a row (e.g. repeated failures) is shown once.
    if (this.items().some((item) => item.message === message)) {
      return;
    }
    const id = this.nextId++;
    this.items.update((items) => [...items, { id, kind, message }]);
    this.timers.set(
      id,
      setTimeout(() => {
        this.dismiss(id);
      }, NOTIFICATION_MS),
    );
  }
}
