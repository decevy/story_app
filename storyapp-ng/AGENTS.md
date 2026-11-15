# Agent instructions — StoryApp Angular (`storyapp-ng`)

Angular rebuild of **`storyapp-web`** (React) with feature parity. Behaviour follows
**[`../storyapp-web/SPEC.md`](../storyapp-web/SPEC.md)**; do not edit that file from here.
`storyapp-web` stays as the reference until parity is confirmed. The backend (`../StoryApp`)
and its API contract are unchanged.

## Stack

- **Angular 22**, standalone components, **zoneless**, OnPush by default. Node **22.22.3+ or 24.15+** (`.nvmrc`: 24).
- **Signals for all template state** (`signal`, `computed`, `linkedSignal`, `httpResource`). No plain mutable fields read by templates.
- Template syntax: `@if`, `@for` (with `track`), `@switch`, `@defer`. No NgModules, no `*ngIf` / `*ngFor`.
- `inject()`, never constructor injection.
- Forms: **Signal Forms** (`@angular/forms/signals`). No Reactive or template-driven forms. Use the form's own `submitting()` state rather than a separate signal. The pages keep `(submit)` + `submit()` instead of `[formRoot]`, because `formRoot` sets `novalidate` and the React pages rely on native validation.
- UI primitives: **Angular Aria** (`@angular/aria`) and **CDK**. **No Angular Material.**
- Styling: **Tailwind CSS v4** (`@tailwindcss/postcss`, `.postcssrc.json`) + `@toolwind/corner-shape`; global rules in `src/styles.css`, adaptive radii in `src/styles/adaptive-rounded.css`. Keep classes identical to the React components.
- HTTP: `HttpClient` (fetch backend is the v22 default; don't add `withFetch()`). `httpResource` for simple GETs; HttpClient + RxJS for mutations and refresh.
- Real-time: `@microsoft/signalr` 9.0.6 (same as storyapp-web).
- Strict TypeScript (`strict`) and strict templates (`strictTemplates`, `typeCheckHostBindings`). ESLint uses type information (`projectService`).
- Template values derived per item (classes, seams) are `computed()` arrays, not method calls in the template.
- Debug output goes through `debugLog()` (`core/logging`), which logs only in dev mode; SignalR logs at `Warning` in production.
- Domain names match the backend: `Story`, `Passage`, `PassageSegment`, `Writer`, `Seam`.

## Naming

New style guide: kebab-case files without type suffixes, class names without `Component`/`Service`
unless clearer (`story-list.ts` → `StoryList`, `auth.ts` → `AuthService`).

## Layout (`src/app`)

`core/` + `shared/` + `features/`. Dependencies point one way, **app → features → shared → core**,
enforced by `eslint-plugin-boundaries` (`eslint.config.js`):

- `core/` imports nothing else from the app (only `src/environments`).
- `shared/` may import `core/`.
- A feature may import `core/` and `shared/`, never another feature. When two features need the
  same thing, move it to `shared/` (UI) or `core/` (services, types).

**Folder per component** (CLI default, `ng g c`): `story-view/story-view.ts`, `.html`, `.spec.ts`.
Services, stores, APIs, guards and plain TS stay flat at the feature (or `core/` sub-folder) root.
Components have no CSS files (Tailwind); `angular.json` sets `style: none` for `ng g c`.

| Folder | Contents |
|--------|----------|
| `core/auth` | `AuthService`, `TokenStore`, `jwt`, `authGuard` / `guestGuard`, `authInterceptor`, `SKIP_AUTH_REFRESH` |
| `core/config` | `APP_CONFIG` token (`apiUrl`, `hubUrl`), storage keys, URL helpers |
| `core/logging` | `debugLog()` (dev-mode-only `console.log`) |
| `core/signalr` | `SignalRService` (connection, hub methods, events as observables, `connectionState`) |
| `core/models` | Shared domain types copied from `storyapp-web/src/types` |
| `shared/ui` | Form UI for every form: `appTextInput` and `appFieldLabel` (directives on the native elements, so `[formField]` keeps working), `appSubmitButton` (`[busy]`), `<app-form-error>`. Planned users: profile, create/edit story, add writer |
| `features/auth` | `login-page/`, `register-page/` (lazy via `loadComponent`) |
| `features/story` | `story.routes.ts`, `StoryStore` (route-level), `StoriesApi`, fonts; `story-page/`, `story-layout/`, `story-list/`, `story-view/`, `passage-span/` |
| `features/story/composer` | `passage-composer.ts`, `segment-visuals.ts`, `composer-dom.ts` (copied unchanged), `ComposerHold`; `composer-field/` |

Config comes from `src/environments/` (dev: `apiUrl: ''`, `hubUrl: '/storyHub'`, through the proxy).

## Key behaviour notes

- **Auth**: `AuthService.initialize()` runs in `provideAppInitializer`; `index.html` shows the loading spinner meanwhile. The initializer finishes before the first navigation, so `authGuard` / `guestGuard` decide synchronously. The interceptor shares one refresh across concurrent 401s; refresh failure clears tokens and routes to `/login`.
- **StoryStore** is provided on the lazy story route; `withAutoCleanupInjectors()` destroys it when the route is left (like unmounting `StoryProvider`). Hub join/leave is an effect on `selectedStoryId` + connection state, which also rejoins after a reconnect.
- **Sending**: `StoryStore.sendPassage` goes through `exhaustMap` (DEC-7), so a send while one is in flight is ignored. `SignalRService.sendPassage` always passes `seamBefore` (`null` when unset): the hub rejects the two-argument call that storyapp-web makes.
- **Composer**: `ComposerHold` (scoped to `StoryView`) owns the draft; `draftVersion` replaces React's `seedToken`. Don't change seam logic, rendering rules or composer interactions here; they follow SPEC.md, including the known cross-passage indentation issue (`it.todo` in `segment-visuals.spec.ts`).
- Component hosts inside flex layouts use `display: contents` so the React markup structure (and its `h-full` / `flex-1` behaviour) is unchanged.

## Tests

Shared fixtures (`testUser`, `makeStory`, `makeStorySummary`, `makePassage`) and helpers (`deferred`, `hasClasses`, `unsignedJwt`) live in `src/testing/`. Only spec files may import them (enforced by the boundary rule), and the app build excludes the folder.

Every file with logic has a colocated `*.spec.ts` (Vitest + TestBed, zoneless): services, stores,
APIs, guards, interceptors, components, pure functions. Files without logic don't: types, config,
constants, route files, `app.config.ts`. `ng g` creates the spec; keep it.

- Components with dependencies get fakes (`{ provide: StoryStore, useValue: {...} }`); a page that
  only composes children overrides its imports with stubs (`story-page.spec.ts`).
- Hold timers use `vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })`.
- `SignalRService` is tested against a fake connection by spying on `HubConnectionBuilder.prototype.build`.
- jsdom lacks `document.execCommand` and `scrollIntoView`; specs stub them. Caret and real
  contenteditable behaviour belong in the Playwright E2E tests.
- Check classes with `classList`, not `className`: Angular does not keep class order.

## Commands

Run from `storyapp-ng/`:

| Task | Command |
|------|---------|
| Dev server (port 3000, proxies `/api` and `/storyHub`) | `npm start` |
| Proxy to another API | `API_PROXY_TARGET=http://localhost:5056 npm start` |
| Unit tests (Vitest, once) | `npx ng test --watch=false` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| E2E (Playwright; needs the API + seeded DB) | `npm run e2e` (first time: `npx playwright install chromium`) |

The E2E config starts `ng serve --configuration e2e` (no Vite prebundling, so the page isn't
reloaded mid-test) unless a server is already running on port 3000. The test user
`aya@test.com` / `test123` comes from `StoryApp.Infrastructure/Data/StoryDbSeeder.cs`.

CI: `../.github/workflows/ci.yml` (jobs `web`, `api`, `e2e`).

`data-testid` hooks: `login-email`, `login-password`, `login-submit`, `story-list-item`,
`composer-field` (active field), `end-passage`, `passages`, `connection-status`.
