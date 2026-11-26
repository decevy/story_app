import { Component, model } from '@angular/core';

import { BOOK_FONT_OPTIONS, type BookFontId, isBookFontId } from '../book-fonts';

/** Font select for the book page: `<sa-font-picker [(font)]="fontId" />`. */
@Component({
  selector: 'sa-font-picker',
  template: `
    <label class="flex shrink-0 items-center gap-2 text-sm text-stone-600">
      <span class="hidden sm:inline">Font</span>
      <select
        [value]="font()"
        (change)="onChange($event)"
        class="max-w-[10.5rem] squircle-md border border-stone-200 bg-white px-2 py-1 text-stone-800 focus:border-stone-400 focus:outline-none"
      >
        @for (option of options; track option.id) {
          <option [value]="option.id" [selected]="option.id === font()">{{ option.label }}</option>
        }
      </select>
    </label>
  `,
})
export class FontPicker {
  readonly font = model.required<BookFontId>();

  protected readonly options = BOOK_FONT_OPTIONS;

  protected onChange(event: Event): void {
    const { value } = event.target as HTMLSelectElement;
    if (isBookFontId(value)) {
      this.font.set(value);
    }
  }
}
