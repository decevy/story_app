import { Component, input } from '@angular/core';

/** Centered card with the app name and a subtitle; the form is projected. */
@Component({
  selector: 'sa-auth-card',
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-100 p-5">
      <div class="w-full max-w-md squircle-lg bg-white p-10 shadow-lg">
        <h1 class="mb-2 text-center text-3xl font-bold text-gray-800">StoryApp</h1>
        <h2 class="mb-8 text-center text-2xl text-gray-600">{{ subtitle() }}</h2>
        <ng-content />
      </div>
    </div>
  `,
})
export class AuthCard {
  readonly subtitle = input.required<string>();
}
