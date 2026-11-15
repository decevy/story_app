import { Component, inject } from '@angular/core';
import { AuthService } from '@core/auth/auth-service';
import { StoryHubClient } from '@core/story-hub/story-hub-client';

/** Page frame of the story area: header with user and connection status, sidebar and main. */
@Component({
  selector: 'sa-story-layout',
  templateUrl: './story-layout.html',
})
export class StoryLayout {
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.user;
  // 'reconnecting' shows as disconnected.
  protected readonly isConnected = inject(StoryHubClient).isConnected;

  protected logout(): void {
    void this.auth.logout();
  }
}
