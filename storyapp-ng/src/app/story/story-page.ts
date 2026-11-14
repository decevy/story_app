import { Component, inject } from '@angular/core';

import { StoryStore } from './story-store';

/** Placeholder until phase 3. */
@Component({
  selector: 'app-story-page',
  template: `<p class="p-6 text-gray-500" data-testid="phase2-probe">
    {{ store.isConnected() ? 'connected' : 'disconnected' }} · {{ store.stories.value().length }} stories
  </p>`,
})
export class StoryPage {
  protected readonly store = inject(StoryStore);
}
