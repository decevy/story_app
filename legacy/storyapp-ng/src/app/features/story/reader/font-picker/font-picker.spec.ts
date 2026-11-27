import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { FontPicker } from './font-picker';

describe('FontPicker', () => {
  it('shows the current font and takes a new choice', async () => {
    const { fixture } = await render(FontPicker, { inputs: { font: 'sourceSerif' } });
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: /font/i });
    expect(select.value).toBe('sourceSerif');

    await userEvent.selectOptions(select, 'EB Garamond');

    expect(fixture.componentInstance.font()).toBe('ebGaramond');
  });
});
