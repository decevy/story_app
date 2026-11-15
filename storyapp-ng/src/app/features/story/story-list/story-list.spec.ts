import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Passage, Story, StorySummary } from '../../../core/models/story.types';
import { StoryStore } from '../story-store';
import { makePassage, makeStorySummary } from '../../../../testing/fixtures';
import { StoryList } from './story-list';

function lastPassage(text: string, minutesAgo: number): Passage {
  return makePassage({
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    segments: [{ id: 1, order: 0, text }],
  });
}

describe('StoryList', () => {
  const stories = signal<StorySummary[]>([]);
  const currentStory = signal<Story | null>(null);
  const selectStory = vi.fn();

  beforeEach(() => {
    stories.set([]);
    currentStory.set(null);
    selectStory.mockReset();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: StoryStore,
          useValue: { stories: { value: stories }, currentStory, selectStory },
        },
      ],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(StoryList);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const items = () => [
      ...element.querySelectorAll<HTMLElement>('[data-testid="story-list-item"]'),
    ];
    return { fixture, element, items };
  }

  it('shows an empty state without stories', async () => {
    const { element, items } = await render();
    expect(element.textContent).toContain('No stories yet');
    expect(items()).toHaveLength(0);
  });

  it('lists stories with writer count, preview and age', async () => {
    stories.set([
      makeStorySummary({ id: 1, writerCount: 1, lastPassage: lastPassage('A'.repeat(60), 5) }),
      makeStorySummary({ id: 2, writerCount: 3 }),
    ]);
    const { element, items } = await render();

    expect(element.textContent).toContain('2 available');
    const [first, second] = items();
    expect(first!.textContent).toContain('Story 1');
    expect(first!.textContent).toContain('1 writer');
    expect(first!.textContent).not.toContain('1 writers');
    expect(first!.textContent).toContain(`${'A'.repeat(50)}...`);
    expect(first!.textContent).toContain('5 minutes ago');
    expect(second!.textContent).toContain('3 writers');
    expect(second!.textContent).toContain('No passages yet');
  });

  it('highlights the current story', async () => {
    stories.set([makeStorySummary({ id: 1 }), makeStorySummary({ id: 2 })]);
    currentStory.set({ id: 2 } as Story);
    const { items } = await render();
    expect(items()[0]!.classList).not.toContain('bg-blue-50');
    expect(items()[1]!.classList).toContain('bg-blue-50');
  });

  it('selects a story when its option is clicked', async () => {
    stories.set([makeStorySummary({ id: 1 }), makeStorySummary({ id: 2 })]);
    const { fixture, items } = await render();

    const option = items()[1]!;
    option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    option.click();
    await fixture.whenStable();

    expect(selectStory).toHaveBeenCalledWith(2);
  });
});
