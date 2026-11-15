import { Component, inject } from '@angular/core';

import { StoryLayout } from '../story-layout/story-layout';
import { StoryList } from '../story-list/story-list';
import { StoryStore } from '../story-store';
import { StoryView } from '../story-view/story-view';

/** Port of storyapp-web/src/pages/StoryPage.tsx. */
@Component({
  selector: 'app-story-page',
  imports: [StoryLayout, StoryList, StoryView],
  template: `
    <app-story-layout>
      <app-story-list storySidebar />
      @if (store.currentStory()) {
        <app-story-view storyMain />
      } @else {
        <div storyMain class="flex items-center justify-center h-full">
          <div class="text-center text-gray-500">
            <p class="text-xl mb-2">Select a story to get started</p>
            <p class="text-sm">Choose from the list on the left</p>
          </div>
        </div>
      }
    </app-story-layout>
  `,
})
export class StoryPage {
  protected readonly store = inject(StoryStore);
}
