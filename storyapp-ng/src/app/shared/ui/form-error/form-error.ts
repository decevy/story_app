import { Component } from '@angular/core';

/** Error box above a form; the message is projected. Announced to screen readers. */
@Component({
  selector: 'sa-form-error',
  host: { class: 'contents' },
  template: `<div role="alert" class="mb-5 squircle-md bg-red-50 p-3 text-sm text-red-600">
    <ng-content />
  </div>`,
})
export class FormError {}
