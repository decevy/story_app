import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Story } from '../../../core/models/story';
import { StoryLayout } from '../story-layout/story-layout';
import { StoryList } from '../story-list/story-list';
import { StoryStore } from '../story-store';
import { StoryView } from '../story-view/story-view';
import { StoryPage } from './story-page';

// Stubs keep this spec about which child is shown, not about the children themselves.
@Component({
  selector: 'app-story-layout',
  template: `<aside><ng-content select="[storySidebar]" /></aside>
    <main><ng-content select="[storyMain]" /></main>`,
})
class StubLayout {}

@Component({ selector: 'app-story-list', template: 'list' })
class StubList {}

@Component({ selector: 'app-story-view', template: 'view' })
class StubView {}

describe('StoryPage', () => {
  const currentStory = signal<Story | null>(null);

  beforeEach(() => {
    currentStory.set(null);
    TestBed.configureTestingModule({
      providers: [{ provide: StoryStore, useValue: { currentStory } }],
    });
    TestBed.overrideComponent(StoryPage, {
      remove: { imports: [StoryLayout, StoryList, StoryView] },
      add: { imports: [StubLayout, StubList, StubView] },
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(StoryPage);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows the list and a prompt until a story is selected', async () => {
    const { element } = await render();
    expect(element.querySelector('aside app-story-list')).not.toBeNull();
    expect(element.querySelector('main')!.textContent).toContain('Select a story to get started');
    expect(element.querySelector('app-story-view')).toBeNull();
  });

  it('shows the story view once a story is loaded', async () => {
    const { fixture, element } = await render();
    currentStory.set({ id: 1 } as Story);
    await fixture.whenStable();

    expect(element.querySelector('main app-story-view')).not.toBeNull();
    expect(element.textContent).not.toContain('Select a story to get started');
  });
});
