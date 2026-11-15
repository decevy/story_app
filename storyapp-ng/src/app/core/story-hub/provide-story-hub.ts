import { type EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

import { StoryHubClient } from './story-hub-client';

/** Opens the hub connection whenever a user is signed in and closes it on logout. */
export function provideStoryHub(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(StoryHubClient).connectWhileSignedIn();
  });
}
