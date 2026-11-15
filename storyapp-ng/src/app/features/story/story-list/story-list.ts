import { Component, computed, inject } from '@angular/core';
import { Listbox, Option } from '@angular/aria/listbox';
import { formatDistanceToNow } from 'date-fns';

import { StorySummary, passageText } from '../../../core/models/story';
import { StoryStore } from '../story-store';

/** Port of storyapp-web/src/components/StoryList.tsx as an Angular Aria listbox. */
@Component({
  selector: 'app-story-list',
  imports: [Listbox, Option],
  host: { class: 'contents' },
  templateUrl: './story-list.html',
})
export class StoryList {
  protected readonly store = inject(StoryStore);

  protected readonly stories = this.store.stories.value;
  protected readonly selected = computed(() => {
    const id = this.store.currentStory()?.id;
    return id == null ? [] : [id];
  });

  protected onSelectionChange(values: number[]): void {
    const storyId = values[0];
    if (storyId != null) {
      this.store.selectStory(storyId);
    }
  }

  protected lastPassagePreview(story: StorySummary): string {
    if (!story.lastPassage) {
      return 'No passages yet';
    }
    const preview = passageText(story.lastPassage);
    return preview.length > 50 ? `${preview.slice(0, 50)}...` : preview;
  }

  protected lastPassageAge(story: StorySummary): string {
    return story.lastPassage
      ? formatDistanceToNow(new Date(story.lastPassage.createdAt), { addSuffix: true })
      : '';
  }
}
