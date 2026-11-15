import { Directive, input } from '@angular/core';

/**
 * Primary submit button of a form. While `busy`, it is disabled and greyed out; the label
 * (e.g. "Signing in...") stays in the template.
 */
@Directive({
  selector: 'button[appSubmitButton]',
  host: {
    type: 'submit',
    class: 'p-3 text-base font-semibold text-white arounded-md corner-squircle mt-2 transition-all',
    '[disabled]': 'busy()',
    '[class]':
      "busy() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'",
  },
})
export class SubmitButton {
  readonly busy = input(false);
}
