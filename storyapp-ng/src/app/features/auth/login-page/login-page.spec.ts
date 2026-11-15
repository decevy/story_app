import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth-service';
import { DEV_MODE } from '@core/config/dev-mode';
import { Logger } from '@core/logging/logger';
import { Notifier } from '@core/notifications/notifier';
import { fakeLogger, fakeNotifier } from '@testing/fakes';
import { deferred } from '@testing/helpers';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let login: ReturnType<typeof vi.fn>;
  let notifier: ReturnType<typeof fakeNotifier>;

  beforeEach(() => {
    login = vi.fn(async () => undefined);
    notifier = fakeNotifier();
  });

  async function setup(inputs: { returnUrl?: string } = {}, devMode = true) {
    const view = await render(LoginPage, {
      inputs,
      providers: [
        { provide: DEV_MODE, useValue: devMode },
        { provide: AuthService, useValue: { login } },
        { provide: Logger, useValue: fakeLogger() },
        { provide: Notifier, useValue: notifier },
      ],
    });
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const button = () => screen.getByTestId<HTMLButtonElement>('login-submit');
    return { ...view, navigateByUrl, button };
  }

  async function fillAndSubmit(view: Awaited<ReturnType<typeof setup>>) {
    await userEvent.type(screen.getByLabelText('Email'), 'aya@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'test123');
    await userEvent.click(view.button());
    await view.fixture.whenStable();
  }

  it('disables the form while signing in, then goes home', async () => {
    const pending = deferred<undefined>();
    login.mockReturnValueOnce(pending.promise);
    const view = await setup();
    await fillAndSubmit(view);

    expect(login).toHaveBeenCalledWith({ email: 'aya@test.com', password: 'test123' });
    expect(view.button().disabled).toBe(true);
    expect(view.button().textContent.trim()).toBe('Signing in...');
    expect(screen.getByLabelText<HTMLInputElement>('Email').disabled).toBe(true);

    pending.resolve(undefined);
    await vi.waitFor(() => {
      expect(view.navigateByUrl).toHaveBeenCalledWith('/');
    });
    await view.fixture.whenStable();
    expect(view.button().disabled).toBe(false);
    expect(view.button().textContent.trim()).toBe('Sign In');
  });

  it('returns to the page the user came from', async () => {
    const view = await setup({ returnUrl: '/stories/3' });
    await fillAndSubmit(view);
    await vi.waitFor(() => {
      expect(view.navigateByUrl).toHaveBeenCalledWith('/stories/3');
    });
  });

  it('ignores a return URL to another site', async () => {
    const view = await setup({ returnUrl: '//evil.test' });
    await fillAndSubmit(view);
    await vi.waitFor(() => {
      expect(view.navigateByUrl).toHaveBeenCalledWith('/');
    });
  });

  it('shows an error on wrong credentials until a field changes', async () => {
    login.mockRejectedValueOnce(new HttpErrorResponse({ status: 401 }));
    const view = await setup();
    await fillAndSubmit(view);

    await vi.waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        'Invalid email or password. Please try again.',
      );
    });
    expect(view.button().disabled).toBe(false);

    await userEvent.type(screen.getByLabelText('Password'), '4');
    await view.fixture.whenStable();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('reports a network failure as a notification and keeps the form usable', async () => {
    login.mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }));
    const view = await setup();
    await fillAndSubmit(view);

    await vi.waitFor(() => {
      expect(notifier.error).toHaveBeenCalledWith(
        'Could not sign in. Check your connection and try again.',
      );
    });
    expect(screen.queryByRole('alert')).toBeNull();

    await userEvent.click(view.button());
    expect(login).toHaveBeenCalledTimes(2);
  });

  it('shows the test accounts in development only', async () => {
    await setup();
    expect(screen.getByTestId('test-accounts')).toBeTruthy();
  });

  it('hides the test accounts in production', async () => {
    await setup({}, false);
    expect(screen.queryByTestId('test-accounts')).toBeNull();
  });
});
