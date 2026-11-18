# Student Management Frontend

A focused, accessible web client for the Student Management API. This project is developed
independently from the backend and uses Angular 22 as its application framework.

The repository is currently in the **finalization stage**. It contains the project setup,
architecture, design tokens, quality tooling, the application shell, JWT authentication, a paginated
student directory, create/read/update/delete flows, role-aware authorization that matches the API
contract, a unified quality layer (consistent validations and error handling, WCAG 2.2 AA
accessibility, responsive layouts from 320px, and consistent loading and empty states), and the
deployment preparation: operational documentation, build-time configuration, container and CI
artifacts, and a backend integration smoke test.

## Table of contents

- [Overview](#overview)
- [Stack](#stack)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Documentation](#documentation)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Architecture decisions](#architecture-decisions)
- [Environment configuration](#environment-configuration)
- [Design system](#design-system)
- [Quality and accessibility](#quality-and-accessibility)
- [Testing](#testing)
- [Deployment](#deployment)
- [Git workflow](#git-workflow)
- [Stage 8 scope](#stage-8-scope)
- [Backend reference](#backend-reference)
- [Roadmap](#roadmap)

## Overview

The application is planned as a clear, low-friction workspace for managing student records. The
visual direction follows the restraint of tools such as Linear, Geist, and GitHub Primer: neutral
surfaces, subtle borders, deliberate spacing, and a single accent color.

The application opens on a sign-in screen. After authentication, an overview screen renders inside a
persistent shell with a sidebar, header, theme control, account menu, and sign-out action. The
students route provides a paginated directory with first-name, last-name, and email filters. Both
roles can review records; administrators can also create, open, edit, and delete them, with
confirmation before deletion.

## Stack

| Concern             | Choice                                                  |
| ------------------- | ------------------------------------------------------- |
| Framework           | Angular 22.2.6                                          |
| Build tooling       | Angular CLI 22.2.7                                      |
| Language            | TypeScript 6.0.3 with `strict` enabled                  |
| Application style   | Standalone components, no NgModules                     |
| Change detection    | Zoneless with signals                                   |
| Routing             | Angular Router with lazy-loaded feature routes          |
| Styling             | SCSS and CSS custom properties                          |
| HTTP                | `HttpClient` configured at the application root         |
| Forms               | Signal Forms in the login screen                        |
| Unit tests          | Vitest 5 through the official Angular unit-test builder |
| Accessibility tests | axe-core 4 against the WCAG 2.2 A/AA rule set           |
| Linting             | ESLint 10 with `angular-eslint` and `typescript-eslint` |
| Formatting          | Prettier 3                                              |
| Package manager     | npm 11                                                  |

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`
- npm 11 or newer

The backend is required for sign-in. Start it at `http://localhost:3000` and set `CORS_ORIGINS` to
include the frontend origin, for example `http://localhost:4200`. Without a configured CORS origin the
browser blocks the login request. The rest of the interface, including validation and session
restoration, can be reviewed without the API.

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Open `http://localhost:4200`. The development server reloads when source files change.

Create a production build:

```bash
npm run build
```

The build output is written to `dist/students-management-frontend/browser`.

## Documentation

The README is the canonical reference for architecture, design decisions, and the API contract.
Operational guides live in `docs/` and link back here instead of repeating it:

| Guide                                                      | Contents                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [docs/installation.md](docs/installation.md)               | Prerequisites, local setup, quality gates, and troubleshooting. |
| [docs/configuration.md](docs/configuration.md)             | Environment contract, build-time variables, and secrets policy. |
| [docs/deployment.md](docs/deployment.md)                   | Build output, hosting, container image, headers, and rollback.  |
| [docs/backend-integration.md](docs/backend-integration.md) | Connection model, endpoint map, and the integration smoke test. |

## Scripts

| Command                      | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| `npm start`                  | Start the development server.                                 |
| `npm run config:generate`    | Generate the production environment file from `API_BASE_URL`. |
| `npm run build`              | Generate the environment, then build for production.          |
| `npm run watch`              | Rebuild continuously with the development configuration.      |
| `npm test`                   | Run unit tests once with Vitest.                              |
| `npm run test:scripts`       | Run the build-tooling tests with the Node.js test runner.     |
| `npm run test:watch`         | Run unit tests in watch mode.                                 |
| `npm run test:coverage`      | Run tests with coverage enabled.                              |
| `npm run lint`               | Lint TypeScript and template files with ESLint.               |
| `npm run format`             | Format the repository with Prettier.                          |
| `npm run format:check`       | Check formatting without writing files.                       |
| `npm run verify:integration` | Run the development-only backend integration smoke test.      |

`npm run build` runs `config:generate` automatically through the npm `prebuild` lifecycle, so a
production build always reflects the current `API_BASE_URL`. See
[docs/configuration.md](docs/configuration.md).

## Project structure

```text
docs/                            # Operational guides, linked from the README
scripts/                         # Dependency-free Node helpers (env generation, smoke test)
.github/workflows/ci.yml         # CI: quality gates and container image build
Dockerfile                       # Multi-stage image: Node build, then nginx runtime
nginx.conf.template              # Templated nginx config: SPA fallback, cache, and security headers
src/
├── app/
│   ├── core/                    # Cross-cutting configuration with no feature ownership
│   │   ├── auth/                # Session state, JWT decoding, interceptor, and guards
│   │   ├── config/              # API base URL and future global configuration
│   │   ├── http/                # URL helpers and unified API error mapping
│   │   └── theme/               # System, light, and dark theme preference
│   ├── features/                # Business features, grouped by capability
│   │   ├── auth/                # Public sign-in route
│   │   │   └── login/           # Signal Form, validation, and error handling
│   │   ├── forbidden/           # Authenticated 403 page for denied routes
│   │   ├── students/            # Directory, detail, editor, and CRUD API service
│   │   └── welcome/             # Overview screen
│   ├── layout/                  # Application shell and navigation
│   │   ├── app-header/          # Page title, theme control, and account menu
│   │   ├── app-shell/           # Sidebar, header, and routed content
│   │   ├── app-sidebar/         # Primary navigation and mobile drawer
│   │   └── navigation.ts        # Navigation model
│   ├── shared/                  # Reusable, presentation-only building blocks
│   │   ├── brand/               # Product brand mark
│   │   └── confirm-dialog/      # Native, accessible confirmation dialog
│   ├── testing/                 # Test-only helpers, excluded from the application build
│   │   └── a11y.ts              # axe-core WCAG 2.2 AA assertion helper
│   ├── app.config.ts            # Application providers
│   ├── app.html                 # Root template
│   ├── app.routes.ts            # Top-level routes
│   ├── app.scss                 # Root component styles
│   ├── app.spec.ts              # Root component tests
│   └── app.ts                   # Root component
├── environments/
│   ├── environment.model.ts     # Typed environment contract
│   ├── environment.ts           # Default fallback for tests and tooling
│   ├── environment.development.ts
│   └── environment.production.ts # Generated on build from API_BASE_URL (Git-ignored)
├── styles/
│   ├── _base.scss               # Global element styles and shared state/loading utilities
│   ├── _reset.scss              # Minimal reset
│   └── _tokens.scss             # Color, type, spacing, shape, and motion tokens
├── index.html
├── main.ts
└── styles.scss
```

The `layout/` directory owns the visual shell. Feature routes render inside its `main` landmark.
`core/auth` owns the session, authorization decisions, and route guards, `core/theme` owns the theme
preference, and `features/auth` owns the public sign-in experience.

## Architecture decisions

### Standalone, zoneless Angular

The application uses standalone components only. Zone.js is not included, and change detection is
driven by signals. The Angular CLI 22 defaults for new projects supply the zoneless setup, so no
extra provider is needed in `app.config.ts`.

### Feature-first organization

Code is grouped by capability rather than by technical type. `features/` owns business
functionality, `shared/` owns reusable presentation, `core/` owns global configuration and
cross-cutting services, and `layout/` owns the visual shell. This avoids generic `components/` and
`services/` folders that accumulate unrelated files.

### Application shell

`AppShell` hosts the persistent frame: a sidebar with primary navigation, a sticky header showing
the current page title and theme control, and a `main` landmark for routed content. The shell is
lazy-loaded as the parent route; each child route supplies its own `title`, which the header reads
from the router snapshot after navigation.

Below 1024px the sidebar becomes an off-canvas drawer. It is removed from the tab order while closed
(`visibility: hidden`), closes on route changes, backdrop clicks, its close control, or `Escape`,
and exposes `aria-expanded`/`aria-controls` on the menu button.

### Theme preference

`ThemeService` stores `system`, `light`, or `dark` in `localStorage` and reflects explicit choices
on the `<html>` element as `data-theme`. When no choice is stored, the CSS `prefers-color-scheme`
query is authoritative, so the application follows the operating system without JavaScript.

### Authentication

The sign-in screen uses Signal Forms (`@angular/forms/signals`) with a typed model and schema-based
validation. `AuthService` posts credentials to `POST /auth/login`, validates the returned role and
JWT claims, and stores the session, including the role and email, in `localStorage` with an absolute
expiry. The client never verifies or trusts the token for authorization; roles only shape the
interface, while the API remains authoritative.

A functional interceptor adds `Authorization: Bearer` to outgoing API requests. When a protected
request returns `401`, the session is cleared and the user is sent back to `/login` with a return URL.
`403` responses keep the session intact and surface an actionable permission message, because the
user is authenticated but lacks the required role. `authGuard` protects the application shell, and
`guestGuard` keeps authenticated users away from the sign-in page.

The JWT payload is decoded without signature verification. Verification belongs to the API; the UI
only reads the identity and role claims needed to personalize the header and the interface.

### Authorization

`AuthorizationService` derives every decision from the existing `AuthService` session: it exposes the
current role, `isAdmin`, `canViewStudents`, and `canManageStudents` as computed signals. No second
copy of the authentication state exists. Student capabilities follow the API contract: `ADMIN` and
`USER` can read the directory and records, while only `ADMIN` can create, edit, or delete.

`roleGuard` reads the roles declared in route `data` and keeps the two failure modes distinct.
Unauthenticated visitors are redirected to `/login?returnUrl=…`; authenticated users without the
required role are redirected to the authenticated `/forbidden` page. A malformed role declaration
denies access instead of silently opening the route.

The directory and detail page hide management controls from `USER` and show a read-only badge.
`/students/new` and `/students/:id/edit` are also protected by the guard, so direct URL navigation is
denied even when controls are hidden. Hiding controls is a usability measure, not the security
boundary: the API validates the role on every request.

### Student directory

`StudentsService` requests `GET /students` with `page`, `limit`, and optional `firstName`, `lastName`,
and `email` parameters. Filtering and pagination are server-side, matching the API contract; the
client never downloads the full collection. The service trims blank filters before sending them.

The route keeps its state in signals and reloads whenever the query changes. Filter inputs are
debounced by 300ms, Enter applies them immediately, and any filter or page-size change returns to the
first page. In-flight requests are cancelled when a newer query arrives, preventing stale responses
from overwriting fresher results. The page renders dedicated loading, error, empty, and filtered-empty
states, and the request can be retried without losing the current query.

Birth dates are formatted in UTC so a date-only value cannot shift to the previous day in negative
time zones. Record creation dates use the visitor's locale.

### Student management

`POST /students`, `PATCH /students/:id`, and `DELETE /students/:id` back the create, edit, and delete
flows. The editor uses Signal Forms with required, email, max-length, and no-future-date validation,
mirrors the API normalization (trimmed names, lowercase email, uppercase document number), and sends
only changed fields on update.

Create and edit routes reuse a single `StudentEditor` component; `/students/new` and
`/students/:id/edit` differ only by the presence of the `:id` parameter. The detail route loads
`GET /students/:id` and renders loading, missing-record, error, and retry states. A one-time
in-memory feedback service carries the success message from a write flow to the page that displays
the result.

Deletion is available from both the directory and the detail page. A shared native-dialog component
confirms the action, exposes busy and error states, and restores focus on close. The directory
reloads after deletion and steps back a page when the current page becomes empty.

API failures are mapped to actionable messages: `400` for invalid values, `403` for missing
permissions, `404` for removed records, `409` for duplicate email addresses or document numbers, and
`0` for an unreachable API.

### Error handling and state consistency

A single `describeApiError(error, messages)` helper in `core/http/api-error.ts` resolves every API
failure through one documented order: non-HTTP errors use a fallback, status `0` always reports an
unreachable API, mapped statuses take priority, and the API envelope message is used as a last resort
(or first for statuses listed in `preferApiMessageFor`, such as validation and conflicts). Each
feature supplies its own `ApiErrorMessages` copy, so wording stays specific while the resolution rules
stay identical. The duplicated per-feature error mappers were removed.

Loading, empty, and error states share a small set of global utilities in `styles/_base.scss`:
`.state-panel`, `.state-panel--center`, `.state-panel--card`, `.state-panel--error`,
`.state-panel__icon`, `.state-panel__action`, and `.loading-panel`. Features compose these classes
instead of redefining frames, icons, and actions, which keeps the four states visually consistent
across the directory, detail, editor, and forbidden pages without introducing a wrapper component.

### Signals and modern component APIs

Local state will use `signal()` and `computed()` as the default. `linkedSignal()` is reserved for
writable state derived from another source, and `effect()` is reserved for synchronizing with
non-reactive APIs. Component contracts use `input()`, `input.required()`, `output()`, and `model()`;
traditional decorator inputs and outputs are avoided in new code.

Members initialized by Angular are declared `readonly`, and template-only members use `protected`.
Components use `ChangeDetectionStrategy.OnPush` and separate `.ts`, `.html`, and `.scss` files.

### Dependency injection

`inject()` is preferred over constructor injection. Singleton services will use the Angular 22
`@Service()` decorator by default; `@Injectable()` remains available when custom provider scope or
configuration is required.

### HTTP and API configuration

`provideHttpClient(withInterceptors([authInterceptor]))` is registered at the application root. The API
origin is exposed through the `API_BASE_URL` injection token in `core/config/api-config.ts`. Feature
services inject the token instead of importing environment files directly, and `buildApiUrl()` joins
the base URL with relative endpoints. This keeps configuration centralized and testable.

### Forms

Forms use Signal Forms from `@angular/forms/signals` with typed models and schema-based validation.
The login form and the student editor bind native inputs through `[formField]`, submit through
`[formRoot]`, and map API failures to accessible alerts. Reactive Forms will only be used if a
documented limitation makes Signal Forms unsuitable.

### Styling

The interface uses plain SCSS and CSS custom properties instead of a component library. This keeps
the bundle small and the visual language specific to the product. Tokens cover surfaces, text,
accent and feedback colors, a 4px-based spacing scale, type sizes, radii, shadows, and motion.

Light and dark palettes follow the operating system by default. An explicit theme choice overrides
the media query through `data-theme`, and the selection is persisted locally. The system font stack
avoids a network dependency. Focus rings, selection colors, reduced-motion handling, and tabular
numerals are part of the foundation rather than later patches.

### File naming

Files follow the Angular 2025 style guide: `welcome.ts`, `welcome.html`, `welcome.scss`, and
`welcome.spec.ts`. Tests live next to the code they cover.

## Environment configuration

Environment files contain no secrets. They are build-time configuration only, and the production
bundle reads no runtime environment variables.

| File                         | Used by                                   | `apiBaseUrl`                            |
| ---------------------------- | ----------------------------------------- | --------------------------------------- |
| `environment.development.ts` | Development server and development builds | `http://localhost:3000`                 |
| `environment.ts`             | Default fallback for tests and tooling    | empty (same origin)                     |
| `environment.production.ts`  | Production builds                         | generated from `API_BASE_URL` (ignored) |

`scripts/generate-environment.mjs` reads `API_BASE_URL` from the environment or a local `.env` file
and writes `environment.production.ts` before each production build. An empty value keeps requests on
the frontend origin, which is the expected setup when a reverse proxy serves the API and the
frontend from one host. `angular.json` selects the file through `fileReplacements`. Copy
`.env.example` to `.env` to set the value locally.

The only value the frontend needs is the public API base URL. Never place credentials, JWT secrets,
database URLs, or private keys in the frontend configuration, in `.env`, or in the bundle: anything
shipped in the bundle is downloadable by any visitor. See
[docs/configuration.md](docs/configuration.md).

## Design system

The design tokens live in `src/styles/_tokens.scss`. The shell and overview screen exercise the core
pieces of the system:

- neutral canvas and surface layers;
- a single indigo accent used sparingly;
- subtle 1px borders and moderate radii;
- a restrained panel shadow;
- a compact type scale with balanced display text;
- responsive stacking at tablet and phone widths;
- light and dark palettes that follow the system until the user chooses otherwise;
- a three-state theme control (system, light, dark) persisted locally;
- an off-canvas navigation drawer below 1024px;
- a focused sign-in screen with a form panel and a supporting feature panel;
- shared danger tokens for validation and authentication errors;
- a directory table with identity avatars, metadata, and responsive column visibility;
- filter controls, a pagination footer, and skeleton placeholders for loading;
- a student detail panel with grouped metadata and destructive-action styling;
- an editor form with inline validation and a responsive two-column layout;
- a native confirmation dialog with busy, error, and reduced-motion states;
- a compact read-only access badge for users without management permissions;
- shared state and loading panels that keep empty, error, and not-found states consistent;

Decorative gradients, glassmorphism, oversized shadows, and unnecessary cards are deliberately
avoided.

## Quality and accessibility

- TypeScript `strict` mode is enabled explicitly in `tsconfig.json`.
- `any` is rejected by ESLint.
- The lint setup includes the Angular template accessibility rules.
- The shell uses semantic `header`, `nav`, `main`, and `aside` landmarks.
- A skip link targets `#main-content`.
- The document declares `lang="en"` and a light/dark color scheme.
- Focus indicators are visible and use a consistent token.
- Navigation links expose `aria-current="page"` on the active route.
- The mobile drawer leaves the tab order when closed, closes on `Escape`, and keeps
  `aria-expanded`/`aria-controls` in sync on its trigger. Opening it moves focus into the
  navigation, and closing it returns focus to the trigger.
- While the drawer is open, the page behind it is inert: it cannot scroll and its content leaves
  the tab order.
- The sign-in form has explicit labels, `autocomplete` hints, `aria-invalid`, and
  `aria-describedby` links to field errors.
- Authentication failures use `role="alert"`; the password visibility control exposes `aria-pressed`.
- The student directory uses a real table with a caption and row headers, labelled filter inputs, and
  a visible focus target for horizontally scrollable results.
- Student rows expose explicit edit and delete controls with descriptive accessible names; delete
  actions require confirmation.
- Role-restricted controls are removed from the accessible tree for read-only users instead of being
  rendered disabled, and the read-only badge communicates the reduced permission level.
- The student editor links every field to an inline error through `aria-invalid` and
  `aria-describedby`, and announces submit failures with `role="alert"`.
- The confirmation dialog is a native `<dialog>`: it takes focus on open, closes on `Escape` or
  cancellation, disables both actions while busy, and returns focus to the trigger.
- Success notices use a polite live region and can be dismissed with the keyboard.
- Loading state is exposed through `aria-busy` and a polite live region; errors use `role="alert"`.
- Disabled pagination controls remain visible so the page structure does not shift.
- Animation is limited to short transitions and is removed for users who prefer reduced motion.
- Interactive controls keep a minimum target size of 24×24 CSS pixels, meeting WCAG 2.2 SC 2.5.8.
- The layout remains usable from 320px upward, with a small-phone tier that tightens padding and
  stacks actions; it does not rely on hover.
- `bypassSecurityTrust` is not used. Direct DOM access is limited to the theme service, which sets a
  single attribute on the document root.

WCAG 2.2 Level AA is the target and the achieved level for the completed application. Every
component spec runs axe-core against the WCAG 2.2 A/AA rule set through the shared
`testing/a11y.ts` helper, so regressions fail the suite. Rules that need a real rendering engine
(`color-contrast`, `link-in-text-block`, `scrollable-region-focusable`, and `target-size`) are
disabled under jsdom and verified manually; contrast is covered by the design tokens and target size
by the minimum-size rule above.

## Testing

Vitest runs through the official Angular unit-test builder. The suite covers the root component,
application shell, sidebar, header, theme preference, overview screen, brand mark input behavior,
JWT decoding, API URL joining, the unified API error mapping, session lifecycle, interceptor behavior,
authorization service permissions, role guard redirects, route configuration, the forbidden page, the
login form, the student service and its CRUD requests, the directory's loading, filtering, pagination,
deletion, empty, and error states, role-aware action visibility, the create and edit flows, the detail
page states, the confirmation dialog, and the shared formatting helpers.

Accessibility is tested in the same run. Component specs call the shared `testing/a11y.ts` helper,
which runs axe-core against the WCAG 2.2 A/AA tags after the DOM is stable and fails on any violation.
The loaded, empty, error, and not-found states of the directory, detail, and editor pages are all
asserted.

```bash
npm test
```

The build-tooling scripts are covered separately with the Node.js test runner:

```bash
npm run test:scripts
```

Coverage is available with:

```bash
npm run test:coverage
```

## Deployment

The application builds to a static single-page application under
`dist/students-management-frontend/browser`. Any static host can serve it; a reverse proxy is only
required to reach the API on the same origin.

```bash
npm ci
npm run build
```

The output uses hashed asset names and a small initial bundle. `index.html` must be served
`no-cache`, hashed assets are immutable, and unknown paths must fall back to `index.html` so deep
links resolve. A `Dockerfile` and `nginx.conf.template` provide the build and a production web
server with the SPA fallback, cache headers, compression, and security headers. The
`Content-Security-Policy` allows `connect-src 'self'` plus the configured `API_BASE_URL`, so the
same value supports a same-origin or a separate-origin API:

```bash
docker build -t students-management-frontend --build-arg API_BASE_URL= .
docker run --rm -p 8080:80 students-management-frontend
```

`.github/workflows/ci.yml` runs the lint, format, test, and build gates on every push and pull
request, and then builds the container image. It never pushes or deploys. Full hosting, header, and
rollback details are in [docs/deployment.md](docs/deployment.md).

## Git workflow

- `main` holds stable, reviewed work.
- `develop` is the integration branch.
- `feature/frontend-foundation` contains Stage 1.
- `feature/layout` contains Stage 2 and builds on the Stage 1 branch until the first pull request is
  merged.
- `feature/authentication` contains Stage 3 and builds on the layout branch.
- `feature/student-list` contains Stage 4 and builds on the authentication branch.
- `feature/student-management` contains Stage 5 and builds on the student-list branch.
- `feature/role-permissions` contains Stage 6 and builds on the student-management branch.
- `feature/quality` contains Stage 7 and builds on the role-permissions branch.
- `feature/deployment` contains Stage 8 and builds on the quality branch.
- Future stages use one `feature/*` branch each and target `develop` through a pull request.

The frontend repository is independent from the backend repository. No backend files are modified by
this project.

## Stage 8 scope

Included:

- operational documentation in `docs/`: installation, configuration, deployment, and backend
  integration, each linking to this README instead of repeating the architecture or the API contract;
- a dependency-free `scripts/generate-environment.mjs` that writes the Git-ignored production
  environment from the `API_BASE_URL` build-time variable, wired to `npm run build` through the
  `prebuild` lifecycle, plus a documented `.env.example`;
- production configuration: the `production` build replaces the environment file, and the deployment
  guidance covers hashed assets, cache policy, compression, security headers, and the SPA fallback;
- deployment artifacts: a multi-stage `Dockerfile`, an `nginx.conf.template` with the SPA fallback,
  cache and security headers whose `connect-src` is rendered from `API_BASE_URL`, a `.dockerignore`,
  and a `public/robots.txt` for the internal app;
- build-tooling tests for the environment generator (safe serialization) and the nginx template
  (CSP without wildcards), run with the Node.js test runner;
- a `scripts/verify-integration.mjs` smoke test that targets development only, uses unique data,
  cleans up in a `finally` block, and verifies `401`, `403`, and `404` behavior;
- a `.github/workflows/ci.yml` pipeline that runs the quality gates and builds the container image
  without pushing or deploying;
- README updates for the finalization stage and full lint, format, test, and production build
  verification.

Excluded:

- backend changes; the API remains read-only for this project;
- visual redesign or changes to the established design tokens and identity;
- runtime configuration, progressive web app features, internationalization, and browser-based
  end-to-end automation;
- automated deployment, secret provisioning, and hosting-specific configuration.

## Backend reference

The backend documentation and Swagger contract were reviewed but not changed. The current API
exposes:

| Method   | Path            | Access          |
| -------- | --------------- | --------------- |
| `POST`   | `/auth/login`   | Public          |
| `GET`    | `/students`     | `ADMIN`, `USER` |
| `GET`    | `/students/:id` | `ADMIN`, `USER` |
| `POST`   | `/students`     | `ADMIN`         |
| `PATCH`  | `/students/:id` | `ADMIN`         |
| `DELETE` | `/students/:id` | `ADMIN`         |

Missing or invalid credentials return `401 Unauthorized`; an authenticated user without the required
role receives `403 Forbidden`. The login response includes the user's `role`, and the signed JWT also
carries `role`, `email`, `sub`, and `exp`. The backend re-reads the user role before authorizing each
protected request, so the client-side role is only a presentation aid.

The local backend runs at `http://localhost:3000`, with Swagger at
`http://localhost:3000/api/docs`. Student fields are `firstName`, `lastName`, `email`,
`documentNumber`, and `birthDate`; the list response wraps records in `data` with pagination
metadata in `meta`.

`POST /students` requires `firstName`, `lastName`, `email`, `documentNumber`, and `birthDate`.
`PATCH /students/:id` accepts any subset of those fields but rejects explicit `null` values.
`birthDate` is an ISO date (`YYYY-MM-DD`) that cannot be in the future. Email addresses and document
numbers are unique; a duplicate returns `409 Conflict`.

`GET /students` accepts the following query parameters:

| Parameter   | Type    | Default | Rules                                          |
| ----------- | ------- | ------- | ---------------------------------------------- |
| `page`      | integer | `1`     | `1`–`10000`                                    |
| `limit`     | integer | `10`    | `1`–`100`                                      |
| `firstName` | string  | —       | Partial, case-insensitive match; max 100 chars |
| `lastName`  | string  | —       | Partial, case-insensitive match; max 100 chars |
| `email`     | string  | —       | Partial, case-insensitive match; max 255 chars |

Blank filters are trimmed away by both the client and the API. Results are ordered by creation date,
newest first. The response shape is:

```json
{
  "data": [],
  "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
}
```

## Roadmap

1. **Foundation** — completed. Project setup, architecture, design tokens, and quality gates.
2. **Layout** — completed. Application shell, sidebar, header, navigation routes, and theme control.
3. **Authentication** — completed. Login, JWT handling, interceptors, and route protection.
4. **Student list** — completed. Directory table, filters, and pagination.
5. **Student management** — completed. Create, detail, edit, and delete flows with validation.
6. **Roles and permissions** — completed. Role-derived authorization, protected routes, and
   role-aware interface behavior.
7. **Quality** — completed. Unified validations and error handling, WCAG 2.2 AA accessibility,
   responsiveness from 320px, consistent loading and empty states, and accessibility tests.
8. **Finalization** — completed. Operational documentation, build-time configuration, container and
   CI artifacts, and a backend integration smoke test.
