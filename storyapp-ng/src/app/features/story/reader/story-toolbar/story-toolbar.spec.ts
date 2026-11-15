import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { StoryToolbar } from './story-toolbar';

describe('StoryToolbar', () => {
  async function setup(canSend: boolean) {
    const endPassage = vi.fn();
    await render(StoryToolbar, {
      inputs: { storyName: 'The Long Night', canSend, font: 'inter' },
      on: { endPassage },
    });
    return { endPassage };
  }

  it('shows the story name', async () => {
    await setup(true);
    expect(screen.getByRole('heading', { level: 2, name: 'The Long Night' })).toBeTruthy();
  });

  it('ends the passage when allowed', async () => {
    const { endPassage } = await setup(true);
    await userEvent.click(screen.getByRole('button', { name: 'End passage' }));
    expect(endPassage).toHaveBeenCalledOnce();
  });

  it('disables "End passage" when there is nothing to send', async () => {
    await setup(false);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'End passage' }).disabled).toBe(
      true,
    );
  });
});
