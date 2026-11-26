import type { Routes } from '@angular/router';

import { StoryStore } from './data-access/story-store';
import { NoStorySelected } from './no-story-selected/no-story-selected';
import { StoryView } from './reader/story-view/story-view';
import { StoryPage } from './story-page/story-page';

/**
 * Lazy-loaded story area. StoryStore lives as long as this route (`withAutoCleanupInjectors` in
 * app.config.ts), so the list and the hub group survive switching between stories.
 */
export const storyRoutes: Routes = [
  {
    path: '',
    component: StoryPage,
    providers: [StoryStore],
    children: [
      { path: '', component: NoStorySelected },
      { path: 'stories/:storyId', component: StoryView },
    ],
  },
];
