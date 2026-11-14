import { Routes } from '@angular/router';

import { StoryPage } from './story-page';
import { StoryStore } from './story-store';

/** Lazy-loaded story area. StoryStore lives as long as this route (see app.config.ts). */
export const storyRoutes: Routes = [{ path: '', component: StoryPage, providers: [StoryStore] }];
