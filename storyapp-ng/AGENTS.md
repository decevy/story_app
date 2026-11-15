# Agent instructions — StoryApp Angular (`storyapp-ng`)

Angular client of StoryApp. It started as a rebuild of a React app (since removed); product
behaviour and the API contract are described in **[`SPEC.md`](./SPEC.md)**. Deliberate changes
made after the port are listed under "Changes since the React port" below. The backend
(`../StoryApp`) is unchanged.

## Stack

- **Angular 22**, standalone components, **zoneless**, OnPush by default. Node **22.22.3+ or 24.15+** (`.nvmrc`: 24; CI reads it).
- **Signals for all template state** (`signal`, `computed`, `linkedSignal`, `httpResource`). No plain mutable fields read by templates.
- Template syntax: `@if`, `@for` (with `track`), `@switch`, `@defer`. No NgModules, no `*ngIf` / `*ngFor`.
- `inject()`, never constructor injection.
- Forms: **Signal Forms** (`@angular/forms/signals`). No Reactive or template-driven forms. Use the form's own `submitting()` state. The pages keep `(submit)` + `submit()` instead of `[formRoot]`, because `formRoot` sets `novalidate` and the pages rely on native validation. Server rejections (4xx) are returned from the submit action as form errors; network and 5xx failures go to the `Notifier` so the form stays retryable.
- UI primitives: **Angular Aria** (`@angular/aria`) and **CDK**. **No Angular Material.**
- Styling: **Tailwind CSS v4** (`@tailwindcss/postcss`, `.postcssrc.json`). Global CSS lives in `src/styles.css` (theme, base, the draft's contenteditable rules); `squircle-{sm,md,lg,xl,full}` utilities in `src/styles/squircle.css`. Fonts are self-hosted with `@fontsource` (no Google Fonts).
- HTTP: `HttpClient` (fetch backend is the v22 default; don't add `withFetch()`). `httpResource` for reads, HttpClient + RxJS for mutations and refresh. Build URLs with `injectApiUrl()` (`core/config/api-url`).
- Real-time: `@microsoft/signalr` 9.0.6, loaded lazily by `StoryHubClient.connect()` so it stays out of the initial bundle.
- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`) and strict templates (`strictTemplates`, `typeCheckHostBindings`, extended diagnostics as errors). ESLint uses type information (`strictTypeChecked`).
- Template values derived per item (classes, seams, view models) are `computed()` arrays or pure pipes, not method calls in the template. (Not lint-enforced: `template/no-call-expression` cannot tell signal reads from method calls.)
- Logging goes through `Logger` (`core/logging`); `no-console` is an error elsewhere. `debug()` is silent in production. User-facing errors go through `Notifier` (`core/notifications`), shown by `<sa-toast-outlet>`; uncaught errors reach `AppErrorHandler`.
- Use `DEV_MODE` (`core/config/dev-mode`) instead of calling `isDevMode()`, so specs can switch it.
- Domain names match the backend: `Story`, `Passage`, `PassageSegment`, `Writer`, `Seam`.

## Naming

- Files are kebab-case and named after what they export: the class name in kebab-case
  (`AuthService` → `auth-service.ts`, `StoryHubClient` → `story-hub-client.ts`, `StoryList` →
  `story-list.ts`). No `.component` / `.service` / `.model` / `.types` suffixes.
- Classes: components are nouns without `Component` (`StoryView`); services keep the role in
  the name when it helps (`AuthService`, `StoriesApi`, `StoryStore`, `DraftStore`, `Logger`).
- Selector prefix **`sa`**: components `sa-story-list`, directives `saTextInput`.
- Types live next to the code that owns them (`auth-dtos.ts`, `story-dtos.ts`, `hub-events.ts`);
  only types shared across features go in `core/models`.
- Inline templates only when they are short (about 15 lines or less); otherwise `templateUrl`.

## Imports

- Path aliases: `@core/*`, `@shared/*`, `@features/*`, `@testing/*` (tsconfig `paths`).
- Imports **across** areas use the aliases; imports **inside** one area (e.g. within `core/`, or
  within `features/story/`) are relative. `no-restricted-imports` enforces the first half.
- Imports are sorted by `simple-import-sort` and type-only imports use `type`
  (`consistent-type-imports`); `eslint --fix` does both.

## Layout (`src/app`)

`core/` + `shared/` + `features/`. Dependencies point one way, **app → features → shared → core**,
enforced by `eslint-plugin-boundaries` (`eslint.config.js`, resolved through the tsconfig aliases):

- `core/` imports nothing else from the app.
- `shared/` may import `core/`.
- A feature may import `core/` and `shared/`, never another feature. When two features need the
  same thing, move it to `shared/` (UI) or `core/` (services, types).

**Folder per component** (CLI default, `ng g c`): `story-view/story-view.ts`, `.html`, `.spec.ts`.
Services, stores, APIs, guards and plain TS stay flat in their folder. Components have no CSS files
(Tailwind); `angular.json` sets `style: none` and the `sa` prefix for `ng g`.

| Folder                       | Contents                                                                                                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/auth`                  | `AuthService`, `TokenStore`, `jwt`, `authGuard` / `guestGuard` / `safeReturnUrl`, `authInterceptor`, `SKIP_AUTH_REFRESH`; `auth-dtos.ts`                                                                                                                                               |
| `core/config`                | `AppConfig` / `APP_CONFIG` / `loadAppConfig()`, `injectApiUrl()` / `isApiUrl()`, `DEV_MODE`                                                                                                                                                                                            |
| `core/http`                  | `isRejection()`, `apiErrorMessage()` for API error responses                                                                                                                                                                                                                           |
| `core/logging`               | `Logger`, `AppErrorHandler`                                                                                                                                                                                                                                                            |
| `core/notifications`         | `Notifier` (toast messages)                                                                                                                                                                                                                                                            |
| `core/storage`               | `LocalStorage` (never throws), `persistedSignal()`                                                                                                                                                                                                                                     |
| `core/time`                  | `Clock` (`now` signal that ticks, for relative times)                                                                                                                                                                                                                                  |
| `core/story-hub`             | `StoryHubClient` (connection, typed `on(event)`, typed hub methods, `connectionState`), `provideStoryHub()` (connects while signed in); `hub-events.ts` (`HubEvents`, `HubMethods`, payloads)                                                                                          |
| `core/models`                | Domain types shared across features: `story.ts`, `user.ts`, `api.ts` (`ErrorResponse`, `MessageResponse`, `PaginatedResponse`)                                                                                                                                                         |
| `shared/ui`                  | Form UI (`saTextInput`, `saFieldLabel`, `saSubmitButton` with `[busy]`, `<sa-form-error>`), `<sa-toast-outlet>`                                                                                                                                                                        |
| `shared/format`              | Pure pipes: `timeAgo` (pass `clock.now()`), `truncate`, `plural`                                                                                                                                                                                                                       |
| `features/auth`              | `auth-card/`, `login-page/`, `register-page/` (lazy via `loadComponent`)                                                                                                                                                                                                               |
| `features/story`             | `story.routes.ts`; `story-page/` (shell), `story-layout/`, `story-list/`, `no-story-selected/`                                                                                                                                                                                         |
| `features/story/data-access` | `StoryStore` (route-level state), `StoriesApi` (all `/stories` endpoints; reads are `httpResource` factories), `story-dtos.ts`                                                                                                                                                         |
| `features/story/reader`      | `story-view/` (route `/stories/:storyId`), `story-toolbar/`, `font-picker/`, `passage-span/`, `book-fonts.ts`                                                                                                                                                                          |
| `features/story/composer`    | `DraftStore` (the draft and Enter/Backspace tap-vs-hold), `hold-timer.ts`, `passage-composer.ts` (pure draft logic), `segment-visuals.ts`, `composer-dom.ts`, `saPlainTextEditable` (contentEditable plain-text segment); `composer-field/` (one draft segment: layout + key gestures) |

## Configuration

Runtime config, not build-time: `src/main.ts` loads `config.json` (served from `public/`) before
bootstrap and passes it to `appConfig(config)`. The file in the repo uses the same origin
(`apiUrl: ''`, `hubUrl: '/storyHub'`), which works with the dev proxy and with an API served
from the same domain. A deployment to another API origin replaces `config.json`; no rebuild is
needed. There is no `src/environments/` folder.

## Routes

| Path                  | What                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/login`, `/register` | Guest only (`guestGuard`). `/login?returnUrl=...` returns there after signing in (`safeReturnUrl` only accepts in-app paths). |
| `/`                   | Story area (`authGuard`), no story open (`NoStorySelected`).                                                                  |
| `/stories/:storyId`   | Story area with that story open (`StoryView`; `storyId` is a component input via `withComponentInputBinding`).                |

`StoryStore` is provided on the story area's parent route, so it (and the list) survives switching
between stories; `withAutoCleanupInjectors()` destroys it when the area is left.

## Key behaviour notes

- **Auth**: `AuthService.initialize()` runs in `provideAppInitializer`; `index.html` shows the loading spinner meanwhile. The initializer finishes before the first navigation, so the guards decide synchronously. The interceptor shares one refresh across concurrent 401s; refresh failure clears the session and routes to `/login?returnUrl=...`. `logout()` navigates to `/login` itself.
- **Hub connection**: `provideStoryHub()` keeps the connection open while a user is signed in (app-level, not route-level). `StoryStore.selectStory` retries a failed connection.
- **StoryStore**: the story list loads on its own (it does not wait for the hub). Hub join/leave is an effect on the selected id + connection state, which also rejoins after a reconnect. While the next story loads, the previous one stays on screen, but sending is blocked until the selected story is the open one. Load failures are exposed as `storiesFailed` / `storyFailed`.
- **Sending**: `StoryStore.sendPassage` resolves `false` while a send is in flight (DEC-7) and when the hub call fails (the user gets a notification); it never rejects. `StoryHubClient.sendPassage` always passes `seamBefore` (`null` when unset): the hub rejects a two-argument call.
- **Composer**: `DraftStore` (scoped to `StoryView`) owns the draft; `draftVersion` tells the fields to rewrite their DOM text. Seam logic and rendering rules follow SPEC.md, including the known cross-passage indentation issue (`it.todo` in `segment-visuals.spec.ts`).
- Component hosts inside flex layouts use `display: contents` so the markup structure (and its `h-full` / `flex-1` behaviour) stays flat. The routed main area is projected with `<router-outlet ngProjectAs="[storyMain]" />`.

## Changes since the React port

Deliberate changes made after the port:

- The open story is in the URL (`/stories/:id`): reload, back button and links work; deep links survive the login.
- Stories load without waiting for the hub connection.
- Load errors are shown (story list with retry; story "could not be opened").
- Relative times ("5 minutes ago") update as time passes.
- Login/register: errors show after the first submit and update as the user fixes the form; network failures show as a notification.
- Test accounts on the login page show in development builds only.
- Global CSS from the React `index.css` that overrode Tailwind (input focus, button hover opacity, link underline) is gone.
- Fonts are self-hosted.

## Tests

Shared test code lives in `src/testing/` (only spec files may import it, enforced by the boundary
rule; the app build excludes the folder):

- `fixtures.ts`: `testUser`, `makeStory`, `makeStorySummary`, `makePassage`.
- `fakes.ts`: `fakeHub()` (writable `connectionState`, `emit()`), `fakeAuth()`, `fakeLogger()`, `fakeNotifier()`.
- `helpers.ts`: `deferred`, `settle`, `hasClasses`, `unsignedJwt`.

Every file with logic has a colocated `*.spec.ts` (Vitest + TestBed, zoneless): services, stores,
APIs, guards, interceptors, components, pipes, pure functions. Files without logic don't: types,
config, constants, route files, `app.config.ts`. `ng g` creates the spec; keep it.

- Component specs use **Testing Library** (`@testing-library/angular`, `@testing-library/user-event`): render, then query by role, label or text. Fall back to `fixture` for inputs set after render or `whenStable()`.
- Components with dependencies get fakes (`{ provide: StoryStore, useValue: {...} }`); a page that only composes children overrides its imports with stubs (`story-page.spec.ts`).
- Hold timers use `vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })`.
- `StoryHubClient` is tested against a fake connection by spying on `HubConnectionBuilder.prototype.build`.
- jsdom lacks `document.execCommand` and `scrollIntoView`; specs stub them. Caret and real contenteditable behaviour belong in the Playwright E2E tests.
- Check classes with `classList`, not `className`: Angular does not keep class order.
- Coverage thresholds (statements/functions/lines 90 %, branches 85 %) are set in `angular.json`; `npm run test:ci` enforces them.

E2E (`e2e/`): page objects in `e2e/support/pages.ts`; `e2e/support/api.ts` signs users in through
the API and opens pre-authenticated browser contexts (`signedInContext`), so only the login tests
use the login form. `sharedStory()` finds a story several users write in (for the real-time test).

## Commands

Run from `storyapp-ng/`:

| Task                                                   | Command                                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Dev server (port 3000, proxies `/api` and `/storyHub`) | `npm start`                                                                                     |
| Proxy to another API                                   | `API_PROXY_TARGET=http://localhost:5056 npm start`                                              |
| Unit tests (watch)                                     | `npm test`                                                                                      |
| Unit tests once, with coverage (as CI)                 | `npm run test:ci`                                                                               |
| Lint                                                   | `npm run lint`                                                                                  |
| Format / check formatting                              | `npm run format` / `npm run format:check`                                                       |
| Build                                                  | `npm run build`                                                                                 |
| E2E (Playwright; needs the API + seeded DB)            | `npm run e2e` (first time: `npx playwright install chromium`); `npm run e2e:ui` for the UI mode |

The E2E config starts `ng serve --configuration e2e` (no Vite prebundling, so the page isn't
reloaded mid-test) unless a server is already running on port 3000. Test users `aya@test.com`
and `bobby@test.com` (password `test123`) come from `StoryApp.Infrastructure/Data/StoryDbSeeder.cs`.

CI: `../.github/workflows/ci.yml` (jobs `web`: format check, lint, unit tests with coverage, build;
`api`; `e2e`).

The draft fields are queried by role (`textbox`, name "Story continuation"). `data-testid` hooks: `login-email`, `login-password`, `login-submit`, `test-accounts`,
`story-list-item`, `end-passage`, `passages`, `connection-status`.
