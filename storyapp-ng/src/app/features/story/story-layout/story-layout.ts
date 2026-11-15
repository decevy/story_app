import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth';
import { SignalRService } from '../../../core/signalr/signalr';

/** Port of storyapp-web/src/components/StoryLayout.tsx; sidebar and main are projected. */
@Component({
  selector: 'app-story-layout',
  templateUrl: './story-layout.html',
})
export class StoryLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly signalR = inject(SignalRService);

  protected readonly user = this.auth.user;
  // 'reconnecting' shows as disconnected, as in the React header.
  protected readonly isConnected = computed(() => this.signalR.connectionState() === 'connected');

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
