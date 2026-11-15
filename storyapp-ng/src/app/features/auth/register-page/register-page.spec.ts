import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../../core/auth/auth';
import { RegisterPage } from './register-page';

interface Values {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const valid: Values = {
  username: 'aya',
  email: 'aya@test.com',
  password: 'test123',
  confirmPassword: 'test123',
};

describe('RegisterPage', () => {
  let register: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    register = vi.fn(async () => undefined);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { register } }],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  async function submit(values: Values) {
    const fixture = TestBed.createComponent(RegisterPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    for (const [id, value] of Object.entries(values)) {
      const field = element.querySelector<HTMLInputElement>(`#${id}`)!;
      field.value = value;
      field.dispatchEvent(new Event('input'));
    }
    // A dispatched submit skips native validation, so the form's own rules run.
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
    return element;
  }

  it('registers without the confirmation field and goes home', async () => {
    await submit(valid);
    expect(register).toHaveBeenCalledWith({
      username: 'aya',
      email: 'aya@test.com',
      password: 'test123',
    });
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/']);
  });

  it('reports a password mismatch before a short password', async () => {
    const element = await submit({ ...valid, password: 'abc', confirmPassword: 'abd' });
    expect(element.textContent).toContain('Passwords do not match');
    expect(register).not.toHaveBeenCalled();
  });

  it('reports a short password', async () => {
    const element = await submit({ ...valid, password: 'abc', confirmPassword: 'abc' });
    expect(element.textContent).toContain('Password must be at least 6 characters');
    expect(register).not.toHaveBeenCalled();
  });

  it('reports a missing username', async () => {
    const element = await submit({ ...valid, username: '' });
    expect(element.textContent).toContain('Username is required');
  });

  it('shows the error message from the API', async () => {
    register.mockRejectedValueOnce(
      new HttpErrorResponse({ status: 400, error: { error: 'Email already exists' } }),
    );
    const element = await submit(valid);
    expect(element.textContent).toContain('Email already exists');
  });

  it('falls back to a generic message', async () => {
    register.mockRejectedValueOnce(new Error('network'));
    const element = await submit(valid);
    expect(element.textContent).toContain('Registration failed. Please try again.');
    const button = element.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button.disabled).toBe(false);
    expect(button.textContent?.trim()).toBe('Sign Up');
  });
});
