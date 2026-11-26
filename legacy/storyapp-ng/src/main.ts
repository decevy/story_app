import { bootstrapApplication } from '@angular/platform-browser';
import { loadAppConfig } from '@core/config/app-config';

import { App } from './app/app';
import { appConfig } from './app/app.config';

loadAppConfig()
  .then((config) => bootstrapApplication(App, appConfig(config)))
  .catch((error: unknown) => {
    console.error('StoryApp failed to start:', error);
    const root = document.querySelector('sa-root');
    if (root) {
      root.textContent = 'StoryApp could not start. Please reload the page.';
    }
  });
