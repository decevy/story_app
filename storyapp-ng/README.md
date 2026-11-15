# StoryApp Angular (storyapp-ng)

Angular 22 client of StoryApp. See [AGENTS.md](./AGENTS.md) for structure, conventions and
commands, and [`../storyapp-web/SPEC.md`](../storyapp-web/SPEC.md) for behaviour.

```bash
npm ci
npm start              # http://localhost:3000, proxies /api and /storyHub to https://localhost:7011
npm test               # unit tests (watch); npm run test:ci for one run with coverage
npm run lint
npm run format
npm run e2e            # needs the API and a seeded database
```

The API location is read at runtime from `config.json` (`public/config.json`); replace that file
in a deployment instead of rebuilding.
