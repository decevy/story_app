import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { Passage, StorySummary } from '@core/models/story';
import { Clock } from '@core/time/clock';
import { makePassage, makeStorySummary } from '@testing/fixtures';
import { render, screen } from '@testing-library/angular';

import { StoryStore } from '../data-access/story-store';
import { StoryList } from './story-list';

const NOW = new Date('2026-01-01T12:00:00Z').getTime();

function lastPassage(text: string, minutesAgo: number): Passage {
  return makePassage({
    createdAt: new Date(NOW - minutesAgo * 60_000).toISOString(),
    segments: [{ id: 1, order: 0, text }],
  });
}

describe('StoryList', () => {
  const stories = signal<StorySummary[]>([]);
  const storiesFailed = signal(false);
  const selectedStoryId = signal<number | null>(null);
  const now = signal(NOW);
  const reloadStories = vi.fn();

  beforeEach(() => {
    stories.set([]);
    storiesFailed.set(false);
    selectedStoryId.set(null);
    now.set(NOW);
    reloadStories.mockReset();
  });

  async function setup() {
    const view = await render(StoryList, {
      providers: [
        { provide: Clock, useValue: { now } },
        {
          provide: StoryStore,
          useValue: { stories, storiesFailed, selectedStoryId, reloadStories },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const items = () => screen.queryAllByTestId('story-list-item');
    return { ...view, navigate, items };
  }

  it('shows an empty state without stories', async () => {
    const { items } = await setup();
    expect(screen.getByText('No stories yet')).toBeTruthy();
    expect(items()).toHaveLength(0);
  });

  it('offers a retry when the stories fail to load', async () => {
    storiesFailed.set(true);
    await setup();
    expect(screen.getByRole('alert').textContent).toContain('Stories could not be loaded');
    screen.getByRole('button', { name: 'Try again' }).click();
    expect(reloadStories).toHaveBeenCalledOnce();
  });

  it('lists stories with writer count, preview and age', async () => {
    stories.set([
      makeStorySummary({ id: 1, writerCount: 1, lastPassage: lastPassage('A'.repeat(60), 5) }),
      makeStorySummary({ id: 2, writerCount: 3 }),
    ]);
    const { items } = await setup();

    expect(screen.getByText('2 available')).toBeTruthy();
    const [first, second] = items();
    expect(first!.textContent).toContain('Story 1');
    expect(first!.textContent).toContain('1 writer');
    expect(first!.textContent).not.toContain('1 writers');
    expect(first!.textContent).toContain(`${'A'.repeat(50)}...`);
    expect(first!.textContent).toContain('5 minutes ago');
    expect(second!.textContent).toContain('3 writers');
    expect(second!.textContent).toContain('No passages yet');
  });

  it('keeps the age up to date as the clock ticks', async () => {
    stories.set([makeStorySummary({ id: 1, lastPassage: lastPassage('Hi', 5) })]);
    const { fixture, items } = await setup();

    now.set(NOW + 60 * 60_000);
    await fixture.whenStable();

    expect(items()[0]!.textContent).toContain('about 1 hour ago');
  });

  it('highlights the selected story', async () => {
    stories.set([makeStorySummary({ id: 1 }), makeStorySummary({ id: 2 })]);
    selectedStoryId.set(2);
    const { items } = await setup();
    expect(items()[0]!.classList).not.toContain('bg-blue-50');
    expect(items()[1]!.classList).toContain('bg-blue-50');
  });

  it('opens a story when its option is clicked', async () => {
    stories.set([makeStorySummary({ id: 1 }), makeStorySummary({ id: 2 })]);
    const { fixture, items, navigate } = await setup();

    const option = items()[1]!;
    option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    option.click();
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/stories', 2]);
  });
});
