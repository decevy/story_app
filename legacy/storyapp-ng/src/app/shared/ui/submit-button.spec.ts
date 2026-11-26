import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SubmitButton } from './submit-button';

@Component({
  imports: [SubmitButton],
  template: `<button type="submit" saSubmitButton [busy]="busy()">Save</button>`,
})
class Host {
  readonly busy = signal(false);
}

describe('SubmitButton', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    return { fixture, button };
  }

  it('is an enabled submit button with the primary style', async () => {
    const { button } = await render();
    expect(button.type).toBe('submit');
    expect(button.disabled).toBe(false);
    expect(button.classList).toContain('bg-blue-500');
    expect(button.classList).toContain('font-semibold');
  });

  it('is disabled and greyed out while busy', async () => {
    const { fixture, button } = await render();
    fixture.componentInstance.busy.set(true);
    await fixture.whenStable();

    expect(button.disabled).toBe(true);
    expect(button.classList).toContain('bg-gray-400');
    expect(button.classList).not.toContain('bg-blue-500');
    expect(button.classList).toContain('font-semibold');
  });
});
