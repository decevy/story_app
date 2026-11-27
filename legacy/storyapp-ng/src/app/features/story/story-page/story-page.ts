import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { StoryLayout } from '../story-layout/story-layout';
import { StoryList } from '../story-list/story-list';

/** Shell of the story area: the list stays put while the child route fills the main area. */
@Component({
  selector: 'sa-story-page',
  imports: [RouterOutlet, StoryLayout, StoryList],
  template: `
    <sa-story-layout>
      <sa-story-list storySidebar />
      <router-outlet ngProjectAs="[storyMain]" />
    </sa-story-layout>
  `,
})
export class StoryPage {}
