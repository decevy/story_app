import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth-service';
import { Logger } from '@core/logging/logger';
import { Notifier } from '@core/notifications/notifier';
import { fakeLogger, fakeNotifier } from '@testing/fakes';
import { render, screen } from '@testing-library/angular';

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

const LABELS: Record<keyof Values, string> = {
  username: 'Username',
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm Password',
};

describe('RegisterPage', () => {
  let register: ReturnType<typeof vi.fn>;
  let notifier: ReturnType<typeof fakeNotifier>;

  beforeEach(() => {
    register = vi.fn(async () => undefined);
    notifier = fakeNotifier();
  });

  async function submit(values: Values) {
    const view = await render(RegisterPage, {
      providers: [
        { provide: AuthService, useValue: { register } },
        { provide: Logger, useValue: fakeLogger() },
        { provide: Notifier, useValue: notifier },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    for (const [field, value] of Object.entries(values) as [keyof Values, string][]) {
      const input = screen.getByLabelText<HTMLInputElement>(LABELS[field], { exact: true });
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    // A dispatched submit skips native validation, so the form's own rules run.
    view.container.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve));
    await view.fixture.whenStable();
    return { navigate };
  }

  const alertText = () => screen.queryByRole('alert')?.textContent ?? '';

  it('registers without the confirmation field and goes home', async () => {
    const { navigate } = await submit(valid);
    expect(register).toHaveBeenCalledWith({
      username: 'aya',
      email: 'aya@test.com',
      password: 'test123',
    });
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('reports a password mismatch before a short password', async () => {
    await submit({ ...valid, password: 'abc', confirmPassword: 'abd' });
    expect(alertText()).toContain('Passwords do not match');
    expect(register).not.toHaveBeenCalled();
  });

  it('reports a short password', async () => {
    await submit({ ...valid, password: 'abc', confirmPassword: 'abc' });
    expect(alertText()).toContain('Password must be at least 6 characters');
    expect(register).not.toHaveBeenCalled();
  });

  it('reports a missing username', async () => {
    await submit({ ...valid, username: '' });
    expect(alertText()).toContain('Username is required');
  });

  it('shows the error message from the API', async () => {
    register.mockRejectedValueOnce(
      new HttpErrorResponse({ status: 400, error: { error: 'Email already exists' } }),
    );
    await submit(valid);
    expect(alertText()).toContain('Email already exists');
  });

  it('falls back to a generic message for a rejection without one', async () => {
    register.mockRejectedValueOnce(new HttpErrorResponse({ status: 400, error: null }));
    await submit(valid);
    expect(alertText()).toContain('Registration failed. Please try again.');
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Sign Up' });
    expect(button.disabled).toBe(false);
  });

  it('reports a network failure as a notification', async () => {
    register.mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }));
    await submit(valid);
    expect(notifier.error).toHaveBeenCalledWith(
      'Could not create your account. Check your connection and try again.',
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
