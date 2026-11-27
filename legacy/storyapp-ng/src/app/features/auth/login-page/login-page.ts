import { Component, computed, inject, input, signal } from '@angular/core';
import {
  disabled,
  email as validEmail,
  form,
  FormField,
  required,
  submit,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import type { LoginRequest } from '@core/auth/auth-dtos';
import { safeReturnUrl } from '@core/auth/auth-guard';
import { AuthService } from '@core/auth/auth-service';
import { DEV_MODE } from '@core/config/dev-mode';
import { isRejection } from '@core/http/api-errors';
import { Logger } from '@core/logging/logger';
import { Notifier } from '@core/notifications/notifier';
import { FieldLabel } from '@shared/ui/field-label';
import { FormError } from '@shared/ui/form-error/form-error';
import { SubmitButton } from '@shared/ui/submit-button';
import { TextInput } from '@shared/ui/text-input';

import { AuthCard } from '../auth-card/auth-card';

@Component({
  selector: 'sa-login-page',
  imports: [AuthCard, FieldLabel, FormError, FormField, RouterLink, SubmitButton, TextInput],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly logger = inject(Logger);
  private readonly notifier = inject(Notifier);

  /** Where to go after signing in (query parameter, set by `authGuard`). */
  readonly returnUrl = input<string>();

  /** Seeded test users, shown in development builds only. */
  protected readonly showTestAccounts = inject(DEV_MODE);

  private readonly model = signal<LoginRequest>({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'Email is required' });
    validEmail(path.email, { message: 'Please enter a valid email address' });
    required(path.password, { message: 'Password is required' });
    disabled(path, { when: () => this.submitting() });
  });

  protected readonly submitting = computed(() => this.loginForm().submitting());

  /** Errors show after the first submit, and then follow the form as the user fixes it. */
  private readonly submitted = signal(false);
  protected readonly formError = computed(() =>
    this.submitted() ? (this.loginForm().errorSummary()[0]?.message ?? '') : '',
  );

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    // Native `required` / `type="email"` validation normally blocks submit first; the form's
    // own rules only show if the browser lets an invalid form through.
    await submit(this.loginForm, async () => {
      try {
        await this.auth.login(this.model());
      } catch (error) {
        this.logger.error('Login failed:', error);
        if (isRejection(error)) {
          // Stays on the form until a field changes.
          return { kind: 'server', message: 'Invalid email or password. Please try again.' };
        }
        this.notifier.error('Could not sign in. Check your connection and try again.');
        return undefined;
      }
      await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
      return undefined;
    });
  }
}
