import { Component, computed, inject, signal } from '@angular/core';
import {
  disabled,
  email as validEmail,
  form,
  FormField,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth-service';
import { apiErrorMessage, isRejection } from '@core/http/api-errors';
import { Logger } from '@core/logging/logger';
import { Notifier } from '@core/notifications/notifier';
import { FieldLabel } from '@shared/ui/field-label';
import { FormError } from '@shared/ui/form-error/form-error';
import { SubmitButton } from '@shared/ui/submit-button';
import { TextInput } from '@shared/ui/text-input';

import { AuthCard } from '../auth-card/auth-card';

interface RegisterModel {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const PASSWORD_MISMATCH = 'passwordMismatch';
const MIN_PASSWORD_LENGTH = 6;

@Component({
  selector: 'sa-register-page',
  imports: [AuthCard, FieldLabel, FormError, FormField, RouterLink, SubmitButton, TextInput],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly logger = inject(Logger);
  private readonly notifier = inject(Notifier);

  private readonly model = signal<RegisterModel>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Min length and the match check use validate() rather than minLength(): minLength() would add
  // a native `minlength` attribute, and both problems are reported in the form's error box
  // instead of a browser bubble.
  protected readonly registerForm = form(this.model, (path) => {
    required(path.username, { message: 'Username is required' });
    required(path.email, { message: 'Email is required' });
    validEmail(path.email, { message: 'Please enter a valid email address' });
    required(path.password, { message: 'Password is required' });
    validate(path.password, ({ value }) =>
      value().length > 0 && value().length < MIN_PASSWORD_LENGTH
        ? {
            kind: 'minLength',
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
          }
        : undefined,
    );
    required(path.confirmPassword, { message: 'Please confirm your password' });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() !== valueOf(path.password)
        ? { kind: PASSWORD_MISMATCH, message: 'Passwords do not match' }
        : undefined,
    );
    disabled(path, { when: () => this.submitting() });
  });

  protected readonly submitting = computed(() => this.registerForm().submitting());

  /**
   * Errors show after the first submit, and then follow the form as the user fixes it. A
   * mismatch is reported before the other problems.
   */
  private readonly submitted = signal(false);
  protected readonly formError = computed(() => {
    if (!this.submitted()) {
      return '';
    }
    const errors = this.registerForm().errorSummary();
    return (errors.find((error) => error.kind === PASSWORD_MISMATCH) ?? errors[0])?.message ?? '';
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    await submit(this.registerForm, async () => {
      const { username, email, password } = this.model();
      try {
        await this.auth.register({ username, email, password });
      } catch (error) {
        this.logger.error('Registration failed:', error);
        if (isRejection(error)) {
          // E.g. "Email already exists"; stays on the form until a field changes.
          const message = apiErrorMessage(error) ?? 'Registration failed. Please try again.';
          return { kind: 'server', message };
        }
        this.notifier.error('Could not create your account. Check your connection and try again.');
        return undefined;
      }
      await this.router.navigate(['/']);
      return undefined;
    });
  }
}
