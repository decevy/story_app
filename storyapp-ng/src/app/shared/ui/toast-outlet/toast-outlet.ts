import { Component, inject } from '@angular/core';
import { Notifier } from '@core/notifications/notifier';

/** Shows the Notifier's messages in the bottom-right corner. Rendered once, by the root. */
@Component({
  selector: 'sa-toast-outlet',
  templateUrl: './toast-outlet.html',
})
export class ToastOutlet {
  protected readonly notifier = inject(Notifier);
}
