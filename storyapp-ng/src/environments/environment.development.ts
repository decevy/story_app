import { AppConfig } from '../app/core/config/app-config';

// Development: same origin as `ng serve`; /api and /storyHub go through proxy.conf.mjs.
export const environment: AppConfig = {
  apiUrl: '',
  hubUrl: '/storyHub',
};
