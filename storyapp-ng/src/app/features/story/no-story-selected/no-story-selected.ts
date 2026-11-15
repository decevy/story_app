import { Component } from '@angular/core';

/** Main area of `/` while no story is open. */
@Component({
  selector: 'sa-no-story-selected',
  host: { class: 'contents' },
  template: `
    <div class="flex h-full items-center justify-center">
      <div class="text-center text-gray-500">
        <p class="mb-2 text-xl">Select a story to get started</p>
        <p class="text-sm">Choose from the list on the left</p>
      </div>
    </div>
  `,
})
export class NoStorySelected {}
