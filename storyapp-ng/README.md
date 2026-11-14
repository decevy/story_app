# StoryApp Angular (storyapp-ng)

Angular 22 rebuild of `storyapp-web`. See [AGENTS.md](./AGENTS.md) for structure, conventions
and commands, and [`../storyapp-web/SPEC.md`](../storyapp-web/SPEC.md) for behaviour.

```bash
npm ci
npm start          # http://localhost:3000, proxies /api and /storyHub to https://localhost:7011
npx ng test --watch=false
npm run e2e        # needs the API and a seeded database
```
