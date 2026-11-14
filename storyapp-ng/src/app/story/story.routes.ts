import { Routes } from '@angular/router';

import { StoryPage } from './story-page';

/** Lazy-loaded story area; route-level providers (StoryStore) are added in phase 2. */
export const storyRoutes: Routes = [{ path: '', component: StoryPage }];
