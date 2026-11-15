import { Component, input, model, output } from '@angular/core';

import type { BookFontId } from '../book-fonts';
import { FontPicker } from '../font-picker/font-picker';

/** Bar above the book page: story title, "End passage" and the font picker. */
@Component({
  selector: 'sa-story-toolbar',
  imports: [FontPicker],
  templateUrl: './story-toolbar.html',
})
export class StoryToolbar {
  readonly storyName = input.required<string>();
  readonly canSend = input.required<boolean>();
  readonly font = model.required<BookFontId>();
  readonly endPassage = output();
}
