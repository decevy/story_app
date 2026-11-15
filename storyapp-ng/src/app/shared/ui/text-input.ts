import { Directive } from '@angular/core';

/** Form text field styling. Put it on the native input so `[formField]` keeps working. */
@Directive({
  selector: 'input[appTextInput]',
  host: {
    class:
      'p-3 text-base border border-gray-300 arounded-md corner-squircle outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed',
  },
})
export class TextInput {}
