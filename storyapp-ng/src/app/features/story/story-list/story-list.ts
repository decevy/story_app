import { Listbox, Option } from '@angular/aria/listbox';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { passageText } from '@core/models/story';
import { Clock } from '@core/time/clock';
import { PluralPipe } from '@shared/format/plural-pipe';
import { TimeAgoPipe } from '@shared/format/time-ago-pipe';
import { TruncatePipe } from '@shared/format/truncate-pipe';

import { StoryStore } from '../data-access/story-store';

/** Characters of the last passage shown under a story. */
const PREVIEW_LENGTH = 50;

/** The stories sidebar, as an Angular Aria listbox. Choosing one opens `/stories/:id`. */
@Component({
  selector: 'sa-story-list',
  imports: [Listbox, Option, PluralPipe, TimeAgoPipe, TruncatePipe],
  host: { class: 'contents' },
  templateUrl: './story-list.html',
})
export class StoryList {
  private readonly store = inject(StoryStore);
  private readonly router = inject(Router);
  protected readonly now = inject(Clock).now;

  protected readonly previewLength = PREVIEW_LENGTH;
  protected readonly failed = this.store.storiesFailed;

  protected readonly items = computed(() =>
    this.store.stories().map((story) => ({
      id: story.id,
      name: story.name,
      writerCount: story.writerCount,
      lastPassageAt: story.lastPassage?.createdAt ?? null,
      preview: story.lastPassage ? passageText(story.lastPassage) : null,
      selected: story.id === this.store.selectedStoryId(),
    })),
  );

  protected readonly selected = computed(() => {
    const id = this.store.selectedStoryId();
    return id == null ? [] : [id];
  });

  protected onSelectionChange(values: number[]): void {
    const storyId = values[0];
    if (storyId != null && storyId !== this.store.selectedStoryId()) {
      void this.router.navigate(['/stories', storyId]);
    }
  }

  protected retry(): void {
    this.store.reloadStories();
  }
}
