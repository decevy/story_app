import { Component, inject, signal } from '@angular/core';
import { FormField, disabled, email, form, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import { LoginRequest } from '../core/models/auth.types';
import { AuthService } from './auth';

/** Port of storyapp-web/src/pages/LoginPage.tsx. */
@Component({
  selector: 'app-login-page',
  imports: [FormField, RouterLink],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  private readonly model = signal<LoginRequest>({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Please enter a valid email address' });
    required(path.password, { message: 'Password is required' });
    disabled(path, () => this.submitting());
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');

    await submit(this.loginForm, {
      action: async () => {
        this.submitting.set(true);
        try {
          await this.auth.login(this.model());
          await this.router.navigate(['/']); // Redirect to home after successful login
        } catch (err) {
          this.error.set('Invalid email or password. Please try again.');
          console.error('Login error:', err);
        } finally {
          this.submitting.set(false);
        }
        return undefined;
      },
      // Native `required` / `type="email"` validation normally blocks submit first (as in
      // the React page); this only runs if the browser lets an invalid form through.
      onInvalid: (tree) => this.error.set(tree().errorSummary()[0]?.message ?? ''),
    });
  }
}
