import { Component, computed, inject, signal } from '@angular/core';
import { FormField, disabled, email, form, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import { LoginRequest } from '../../../core/models/auth.types';
import { AuthService } from '../../../core/auth/auth';
import { FieldLabel } from '../../../shared/ui/field-label';
import { FormError } from '../../../shared/ui/form-error/form-error';
import { SubmitButton } from '../../../shared/ui/submit-button';
import { TextInput } from '../../../shared/ui/text-input';

/** Port of storyapp-web/src/pages/LoginPage.tsx. */
@Component({
  selector: 'app-login-page',
  imports: [FieldLabel, FormError, FormField, RouterLink, SubmitButton, TextInput],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly error = signal('');

  private readonly model = signal<LoginRequest>({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Please enter a valid email address' });
    required(path.password, { message: 'Password is required' });
    disabled(path, () => this.submitting());
  });

  /** True while submit() runs the action; tracked by Signal Forms. */
  protected readonly submitting = computed(() => this.loginForm().submitting());

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');

    await submit(this.loginForm, {
      action: async () => {
        try {
          await this.auth.login(this.model());
          await this.router.navigate(['/']); // Redirect to home after successful login
        } catch (err) {
          this.error.set('Invalid email or password. Please try again.');
          console.error('Login error:', err);
        }
        return undefined;
      },
      // Native `required` / `type="email"` validation normally blocks submit first (as in
      // the React page); this only runs if the browser lets an invalid form through.
      onInvalid: (tree) => this.error.set(tree().errorSummary()[0]?.message ?? ''),
    });
  }
}
