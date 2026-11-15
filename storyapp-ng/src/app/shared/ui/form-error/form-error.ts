import { Component } from '@angular/core';

/** Error box above a form; the message is projected. Announced to screen readers. */
@Component({
  selector: 'app-form-error',
  host: { class: 'contents' },
  template: `<div
    role="alert"
    class="bg-red-50 text-red-600 p-3 arounded-md corner-squircle mb-5 text-sm"
  >
    <ng-content />
  </div>`,
})
export class FormError {}
