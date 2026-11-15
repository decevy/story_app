import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';

import { FieldLabel } from './field-label';
import { TextInput } from './text-input';

@Component({
  imports: [FieldLabel, FormField, TextInput],
  template: `<label for="name" appFieldLabel>Name</label>
    <input appTextInput id="name" class="extra" [formField]="nameForm.name" />`,
})
class Host {
  readonly model = signal({ name: 'Aya' });
  readonly nameForm = form(this.model);
}

describe('TextInput and FieldLabel', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      input: element.querySelector('input')!,
      label: element.querySelector('label')!,
    };
  }

  it('styles the input and keeps its own classes', async () => {
    const { input } = await render();
    expect(input.classList).toContain('border-gray-300');
    expect(input.classList).toContain('focus:ring-2');
    expect(input.classList).toContain('extra');
  });

  it('still binds to Signal Forms', async () => {
    const { fixture, input } = await render();
    expect(input.value).toBe('Aya');
    input.value = 'Bobby';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.model().name).toBe('Bobby');
  });

  it('styles the label', async () => {
    const { label } = await render();
    expect(label.className).toBe('text-sm font-medium text-gray-800');
  });
});
