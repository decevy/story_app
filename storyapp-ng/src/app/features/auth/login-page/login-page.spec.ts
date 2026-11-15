import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../../core/auth/auth';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let resolveLogin: () => void;
  let rejectLogin: (error: unknown) => void;
  let login: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    login = vi.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          resolveLogin = resolve;
          rejectLogin = reject;
        }),
    );
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  /** Lets the submit action's promise chain settle, then renders. */
  async function settle(page: Awaited<ReturnType<typeof render>>) {
    await new Promise((resolve) => setTimeout(resolve));
    await page.fixture.whenStable();
  }

  async function render() {
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = (testId: string) =>
      element.querySelector<HTMLInputElement>(`[data-testid="${testId}"]`)!;
    const button = element.querySelector<HTMLButtonElement>('[data-testid="login-submit"]')!;
    return { fixture, element, input, button };
  }

  async function fillAndSubmit(page: Awaited<ReturnType<typeof render>>) {
    for (const [testId, value] of [
      ['login-email', 'aya@test.com'],
      ['login-password', 'test123'],
    ]) {
      const field = page.input(testId);
      field.value = value;
      field.dispatchEvent(new Event('input'));
    }
    page.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await page.fixture.whenStable();
  }

  it('disables the form while signing in and re-enables it afterwards', async () => {
    const page = await render();
    await fillAndSubmit(page);

    expect(login).toHaveBeenCalledWith({ email: 'aya@test.com', password: 'test123' });
    expect(page.button.disabled).toBe(true);
    expect(page.button.textContent?.trim()).toBe('Signing in...');
    expect(page.input('login-email').disabled).toBe(true);

    resolveLogin();
    await settle(page);

    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/']);
    expect(page.button.disabled).toBe(false);
    expect(page.button.textContent?.trim()).toBe('Sign In');
    expect(page.input('login-email').disabled).toBe(false);
  });

  it('shows an error and re-enables the form when sign-in fails', async () => {
    const page = await render();
    await fillAndSubmit(page);

    rejectLogin(new Error('401'));
    await settle(page);

    expect(page.element.textContent).toContain('Invalid email or password. Please try again.');
    expect(page.button.disabled).toBe(false);
  });
});
