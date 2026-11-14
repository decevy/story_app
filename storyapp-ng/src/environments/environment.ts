import { AppConfig } from '../app/core/config/app-config';

// Production: replace with the deployed API origin (see storyapp-web/.env.production).
export const environment: AppConfig = {
  apiUrl: 'https://your-api-domain.com',
  hubUrl: 'https://your-api-domain.com/storyHub',
};
