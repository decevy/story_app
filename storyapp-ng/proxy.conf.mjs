// Dev-server proxy: same routes as storyapp-web/vite.config.ts.
// API_PROXY_TARGET lets CI point at the API over http (default: https profile on 7011).
const target = process.env.API_PROXY_TARGET ?? 'https://localhost:7011';

export default {
  '/api': {
    target,
    changeOrigin: true,
    secure: false,
  },
  '/storyHub': {
    target,
    changeOrigin: true,
    secure: false,
    ws: true,
  },
};
