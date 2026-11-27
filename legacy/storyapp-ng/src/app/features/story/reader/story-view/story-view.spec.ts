import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { type Passage, Seam, type Story } from '@core/models/story';
import { makePassage, makeStory } from '@testing/fixtures';
import { hasClasses } from '@testing/helpers';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { StoryStore } from '../../data-access/story-store';
import { FONT_STORAGE_KEY } from '../book-fonts';
import { StoryView } from './story-view';

const story = makeStory({ id: 3, name: 'The Long Night' });

function passage(id: number, text: string, seamAfter?: Seam): Passage {
  return makePassage({
    id,
    storyId: story.id,
    createdAt: `2026-01-0${id}`,
    segments: [{ id, order: 0, text, seamAfter }],
  });
}

describe('StoryView', () => {
  const currentStory = signal<Story | null>(story);
  const storyFailed = signal(false);
  const passages = signal<Passage[]>([]);
  const isConnected = signal(true);
  const sendPassage = vi.fn(async () => true);
  const selectStory = vi.fn();
  const leaveCurrentStory = vi.fn();
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    currentStory.set(story);
    storyFailed.set(false);
    passages.set([]);
    isConnected.set(true);
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  async function setup() {
    const view = await render(StoryView, {
      inputs: { storyId: 3 },
      providers: [
        provideRouter([]),
        {
          provide: StoryStore,
          useValue: {
            currentStory,
            storyFailed,
            passages,
            lastPassage: computed(() => passages().at(-1) ?? null),
            isConnected,
            isSending: signal(false),
            sendPassage,
            selectStory,
            leaveCurrentStory,
          },
        },
      ],
    });
    return view;
  }

  const endButton = () => screen.getByRole<HTMLButtonElement>('button', { name: 'End passage' });
  const field = () => screen.getByTestId('composer-field');
  const sheet = (container: Element) =>
    container.querySelector<HTMLElement>('[style*="font-family"]')!;

  it('opens the story from the route and leaves it when destroyed', async () => {
    const view = await setup();
    expect(selectStory).toHaveBeenCalledWith(3);

    view.fixture.componentRef.setInput('storyId', 4);
    await view.fixture.whenStable();
    expect(selectStory).toHaveBeenLastCalledWith(4);

    view.fixture.destroy();
    expect(leaveCurrentStory).toHaveBeenCalledOnce();
  });

  it('shows a loading state until the story is there', async () => {
    currentStory.set(null);
    await setup();
    expect(screen.getByRole('status').textContent).toContain('Loading story');
  });

  it('explains when the story cannot be opened', async () => {
    storyFailed.set(true);
    await setup();
    expect(screen.getByText('This story could not be opened')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to your stories' }).getAttribute('href')).toBe(
      '/',
    );
  });

  it('shows the story name and an opening prompt without passages', async () => {
    await setup();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('The Long Night');
    expect(screen.getByText(/No passages yet/)).toBeTruthy();
  });

  it('renders the passages and scrolls to the stitch point', async () => {
    passages.set([passage(1, 'Once '), passage(2, 'upon ')]);
    await setup();
    expect(screen.getByTestId('passages').textContent).toBe('Once upon ');
    expect(screen.queryByText(/No passages yet/)).toBeNull();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
  });

  it('starts a passage on a new line after a passage that ended with a paragraph', async () => {
    passages.set([passage(1, 'Once ', Seam.Paragraph), passage(2, 'upon ')]);
    await setup();
    const spans = screen.getByTestId('passages').querySelectorAll('span > span');
    expect(hasClasses(spans[1]!, 'block indent-[2em]')).toBe(true);
  });

  it('lays out the draft from the last passage seam', async () => {
    passages.set([passage(1, 'The end. ', Seam.Section)]);
    await setup();
    expect(hasClasses(field(), 'w-full')).toBe(true);
  });

  it('enables End passage once the draft has text, and sends it', async () => {
    const { fixture } = await setup();
    expect(endButton().disabled).toBe(true);

    field().textContent = 'Hello';
    field().dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(endButton().disabled).toBe(false);

    await userEvent.click(endButton());
    expect(sendPassage).toHaveBeenCalledWith([{ order: 0, text: 'Hello ' }], undefined);
  });

  it('disables End passage while disconnected', async () => {
    const { fixture } = await setup();
    field().textContent = 'Hello';
    field().dispatchEvent(new Event('input'));
    isConnected.set(false);
    await fixture.whenStable();
    expect(endButton().disabled).toBe(true);
  });

  it('uses the stored book font and remembers a new choice', async () => {
    localStorage.setItem(FONT_STORAGE_KEY, 'plexMono');
    const { container, fixture } = await setup();
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: /font/i });
    expect(select.value).toBe('plexMono');
    expect(sheet(container).style.fontFamily).toContain('IBM Plex Mono');

    await userEvent.selectOptions(select, 'EB Garamond');
    await fixture.whenStable();
    expect(sheet(container).style.fontFamily).toContain('EB Garamond');
    expect(localStorage.getItem(FONT_STORAGE_KEY)).toBe('ebGaramond');
  });

  it('focuses the composer when the sheet is clicked', async () => {
    const { container } = await setup();
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    sheet(container).dispatchEvent(down);

    expect(down.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(field());
  });

  it('focuses the composer when a passage is clicked', async () => {
    passages.set([passage(1, 'Once ')]);
    await setup();
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    screen.getByText('Once').dispatchEvent(down);

    expect(down.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(field());
  });

  it('does not steal clicks on the composer itself', async () => {
    await setup();
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    field().dispatchEvent(down);
    expect(down.defaultPrevented).toBe(false);
  });
});
