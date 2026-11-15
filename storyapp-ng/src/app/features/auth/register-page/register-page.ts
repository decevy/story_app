import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormField,
  disabled,
  email,
  form,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth';
import { FieldLabel } from '../../../shared/ui/field-label';
import { FormError } from '../../../shared/ui/form-error/form-error';
import { SubmitButton } from '../../../shared/ui/submit-button';
import { TextInput } from '../../../shared/ui/text-input';

interface RegisterModel {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const PASSWORD_MISMATCH = 'passwordMismatch';

/** Port of storyapp-web/src/pages/RegisterPage.tsx. */
@Component({
  selector: 'app-register-page',
  imports: [FieldLabel, FormError, FormField, RouterLink, SubmitButton, TextInput],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly error = signal('');

  private readonly model = signal<RegisterModel>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Min length and the match check use validate() rather than minLength(): minLength()
  // would add a native `minlength` attribute, and the React page reports both problems in
  // its own error box instead of a browser bubble.
  protected readonly registerForm = form(this.model, (path) => {
    required(path.username, { message: 'Username is required' });
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Please enter a valid email address' });
    required(path.password, { message: 'Password is required' });
    validate(path.password, ({ value }) =>
      value().length > 0 && value().length < 6
        ? { kind: 'minLength', message: 'Password must be at least 6 characters' }
        : undefined,
    );
    required(path.confirmPassword, { message: 'Please confirm your password' });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() !== valueOf(path.password)
        ? { kind: PASSWORD_MISMATCH, message: 'Passwords do not match' }
        : undefined,
    );
    disabled(path, () => this.submitting());
  });

  /** True while submit() runs the action; tracked by Signal Forms. */
  protected readonly submitting = computed(() => this.registerForm().submitting());

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');

    await submit(this.registerForm, {
      action: async () => {
        try {
          const { username, email: emailValue, password } = this.model();
          await this.auth.register({ username, email: emailValue, password });
          await this.router.navigate(['/']); // Redirect to home after successful registration
        } catch (err) {
          const body =
            err instanceof HttpErrorResponse ? (err.error as { error?: string } | null) : null;
          this.error.set(body?.error || 'Registration failed. Please try again.');
          console.error('Registration error:', err);
        }
        return undefined;
      },
      onInvalid: (tree) => {
        // Same precedence as the React page: mismatch first, then length.
        const errors = tree().errorSummary();
        const shown = errors.find((e) => e.kind === PASSWORD_MISMATCH) ?? errors[0];
        this.error.set(shown?.message ?? '');
      },
    });
  }
}
