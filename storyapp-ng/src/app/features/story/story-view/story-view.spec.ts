import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Passage, Seam } from '../../../core/models/story';
import { BOOK_FONTS, FONT_STORAGE_KEY } from '../book-fonts';
import { StoryStore } from '../story-store';
import { makePassage, makeStory } from '../../../../testing/fixtures';
import { hasClasses } from '../../../../testing/helpers';
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
  let fixture: ComponentFixture<StoryView>;
  let element: HTMLElement;
  const passages = signal<Passage[]>([]);
  const isConnected = signal(true);
  const sendPassage = vi.fn(async () => true);
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    passages.set([]);
    isConnected.set(true);
    sendPassage.mockClear();
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: StoryStore,
          useValue: {
            currentStory: signal(story),
            passages,
            lastPassage: computed(() => passages().at(-1) ?? null),
            isConnected,
            isSending: signal(false),
            sendPassage,
          },
        },
      ],
    });
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(StoryView);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  const endButton = () => element.querySelector<HTMLButtonElement>('[data-testid="end-passage"]')!;
  const field = () => element.querySelector<HTMLElement>('[data-testid="composer-field"]')!;
  const fontSelect = () => element.querySelector<HTMLSelectElement>('select')!;

  it('shows the story name and an opening prompt without passages', async () => {
    await render();
    expect(element.querySelector('h2')!.textContent).toBe('The Long Night');
    expect(element.textContent).toContain('No passages yet');
  });

  it('renders the passages and scrolls to the stitch point', async () => {
    passages.set([passage(1, 'Once '), passage(2, 'upon ')]);
    await render();
    expect(element.querySelector('[data-testid="passages"]')!.textContent).toBe('Once upon ');
    expect(element.textContent).not.toContain('No passages yet');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
  });

  it('starts a passage on a new line after a passage that ended with a paragraph', async () => {
    passages.set([passage(1, 'Once ', Seam.Paragraph), passage(2, 'upon ')]);
    await render();
    const spans = element.querySelectorAll('[data-testid="passages"] span > span');
    expect(hasClasses(spans[1]!, 'block indent-[2em]')).toBe(true);
  });

  it('lays out the draft from the last passage seam', async () => {
    passages.set([passage(1, 'The end. ', Seam.Section)]);
    await render();
    expect(hasClasses(field(), 'w-full')).toBe(true);
  });

  it('enables End passage once the draft has text, and sends it', async () => {
    await render();
    expect(endButton().disabled).toBe(true);

    field().textContent = 'Hello';
    field().dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(endButton().disabled).toBe(false);

    endButton().click();
    await fixture.whenStable();
    expect(sendPassage).toHaveBeenCalledWith([{ order: 0, text: 'Hello ' }], undefined);
  });

  it('disables End passage while disconnected', async () => {
    await render();
    field().textContent = 'Hello';
    field().dispatchEvent(new Event('input'));
    isConnected.set(false);
    await fixture.whenStable();
    expect(endButton().disabled).toBe(true);
  });

  it('uses the stored book font and remembers a new choice', async () => {
    localStorage.setItem(FONT_STORAGE_KEY, 'plexMono');
    await render();
    const page = element.querySelector<HTMLElement>('[style*="font-family"]')!;
    expect(fontSelect().value).toBe('plexMono');
    expect(page.style.fontFamily).toContain('IBM Plex Mono');

    fontSelect().value = 'ebGaramond';
    fontSelect().dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(page.style.fontFamily).toContain('EB Garamond');
    expect(localStorage.getItem(FONT_STORAGE_KEY)).toBe('ebGaramond');
    expect(fontSelect().options).toHaveLength(Object.keys(BOOK_FONTS).length);
  });

  it('focuses the composer when the page is clicked', async () => {
    await render();
    const page = element.querySelector<HTMLElement>('[style*="font-family"]')!;
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    page.dispatchEvent(down);

    expect(down.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(field());
  });

  it('does not steal clicks on the composer itself', async () => {
    await render();
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    field().dispatchEvent(down);
    expect(down.defaultPrevented).toBe(false);
  });
});
