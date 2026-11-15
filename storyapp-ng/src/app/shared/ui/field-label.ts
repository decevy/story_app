import { Directive } from '@angular/core';

/** Label above a form field. */
@Directive({
  selector: 'label[appFieldLabel]',
  host: { class: 'text-sm font-medium text-gray-800' },
})
export class FieldLabel {}
