import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FormError } from './form-error';

@Component({
  imports: [FormError],
  template: `<sa-form-error>Invalid email or password.</sa-form-error>`,
})
class Host {}

describe('FormError', () => {
  it('shows the projected message as an alert', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')!;

    expect(alert.textContent.trim()).toBe('Invalid email or password.');
    expect(alert.classList).toContain('bg-red-50');
    expect(alert.classList).toContain('text-red-600');
  });
});
