# Student Management Frontend

A focused, accessible web client for the Student Management API. This project is developed
independently from the backend and uses Angular 22 as its application framework.

The repository is currently in the **authentication stage**. It contains the project setup,
architecture, design tokens, quality tooling, the application shell, navigation, and a JWT-based
sign-in flow. Student CRUD and API-backed student data are intentionally out of scope for this stage.

## Table of contents

- [Overview](#overview)
- [Stack](#stack)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Architecture decisions](#architecture-decisions)
- [Environment configuration](#environment-configuration)
- [Design system](#design-system)
- [Quality and accessibility](#quality-and-accessibility)
- [Testing](#testing)
- [Git workflow](#git-workflow)
- [Stage 3 scope](#stage-3-scope)
- [Backend reference](#backend-reference)
- [Roadmap](#roadmap)

## Overview

The application is planned as a clear, low-friction workspace for managing student records. The
visual direction follows the restraint of tools such as Linear, Geist, and GitHub Primer: neutral
surfaces, subtle borders, deliberate spacing, and a single accent color.

The application opens on a sign-in screen. After authentication, an overview screen renders inside a
persistent shell with a sidebar, header, theme control, account menu, and sign-out action. A students
route is available as a placeholder for the next feature stage.

## Stack

| Concern           | Choice                                                  |
| ----------------- | ------------------------------------------------------- |
| Framework         | Angular 22.2.6                                          |
| Build tooling     | Angular CLI 22.2.7                                      |
| Language          | TypeScript 6.0.3 with `strict` enabled                  |
| Application style | Standalone components, no NgModules                     |
| Change detection  | Zoneless with signals                                   |
| Routing           | Angular Router with lazy-loaded feature routes          |
| Styling           | SCSS and CSS custom properties                          |
| HTTP              | `HttpClient` configured at the application root         |
| Forms             | Signal Forms in the login screen                        |
| Unit tests        | Vitest 5 through the official Angular unit-test builder |
| Linting           | ESLint 10 with `angular-eslint` and `typescript-eslint` |
| Formatting        | Prettier 3                                              |
| Package manager   | npm 11                                                  |

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

## Scripts

| Command                 | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `npm start`             | Start the development server.                            |
| `npm run build`         | Build the application for production.                    |
| `npm run watch`         | Rebuild continuously with the development configuration. |
| `npm test`              | Run unit tests once with Vitest.                         |
| `npm run test:watch`    | Run unit tests in watch mode.                            |
| `npm run test:coverage` | Run tests with coverage enabled.                         |
| `npm run lint`          | Lint TypeScript and template files with ESLint.          |
| `npm run format`        | Format the repository with Prettier.                     |
| `npm run format:check`  | Check formatting without writing files.                  |

## Project structure

```text
src/
├── app/
│   ├── core/                    # Cross-cutting configuration with no feature ownership
│   │   ├── auth/                # Session state, JWT decoding, interceptor, and guards
│   │   ├── config/              # API base URL and future global configuration
│   │   ├── http/                # URL helpers shared by API services
│   │   └── theme/               # System, light, and dark theme preference
│   ├── features/                # Business features, grouped by capability
│   │   ├── auth/                # Public sign-in route
│   │   │   └── login/           # Signal Form, validation, and error handling
│   │   ├── students/            # Student workspace route (placeholder)
│   │   └── welcome/             # Overview screen
│   ├── layout/                  # Application shell and navigation
│   │   ├── app-header/          # Page title, theme control, and account menu
│   │   ├── app-shell/           # Sidebar, header, and routed content
│   │   ├── app-sidebar/         # Primary navigation and mobile drawer
│   │   └── navigation.ts        # Navigation model
│   ├── shared/                  # Reusable, presentation-only building blocks
│   │   └── brand/               # Product brand mark
│   ├── app.config.ts            # Application providers
│   ├── app.html                 # Root template
│   ├── app.routes.ts            # Top-level routes
│   ├── app.scss                 # Root component styles
│   ├── app.spec.ts              # Root component tests
│   └── app.ts                   # Root component
├── environments/
│   ├── environment.model.ts     # Typed environment contract
│   ├── environment.ts           # Production defaults
│   └── environment.development.ts
├── styles/
│   ├── _base.scss               # Global element styles
│   ├── _reset.scss              # Minimal reset
│   └── _tokens.scss             # Color, type, spacing, shape, and motion tokens
├── index.html
├── main.ts
└── styles.scss
```

The `layout/` directory owns the visual shell. Feature routes render inside its `main` landmark.
`core/auth` owns the session, `core/theme` owns the theme preference, and `features/auth` owns the
public sign-in experience.

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
validation. `AuthService` posts credentials to `POST /auth/login`, decodes the email claim from the
returned JWT, and stores the session in `localStorage` with an absolute expiry. The client never
verifies or trusts the token for authorization; roles only shape the interface, while the API remains
authoritative.

A functional interceptor adds `Authorization: Bearer` to outgoing API requests. When a protected
request returns `401`, the session is cleared and the user is sent back to `/login` with a return URL.
`authGuard` protects the application shell, and `guestGuard` keeps authenticated users away from the
sign-in page.

The JWT payload is decoded without signature verification. Verification belongs to the API; the UI
only reads the email claim to personalize the header.

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
The login form binds native inputs through `[formField]`, submits through `[formRoot]`, and maps API
failures to an accessible alert. Reactive Forms will only be used if a documented limitation makes
Signal Forms unsuitable.

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

Environment files contain no secrets. They are build-time configuration only.

- `environment.development.ts` points `apiBaseUrl` at `http://localhost:3000`, matching the local
  backend default.
- `environment.ts` uses an empty `apiBaseUrl`, which keeps requests on the frontend origin. This is
  the expected production setup when a reverse proxy serves both applications from one host.

The development configuration is selected through a file replacement in `angular.json`. Adjust the
production value when the deployment topology is known. Never place credentials, JWT secrets, or
private keys in the frontend.

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
- shared danger tokens for validation and authentication errors.

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
  `aria-expanded`/`aria-controls` in sync on its trigger.
- While the drawer is open, the page behind it cannot scroll.
- The sign-in form has explicit labels, `autocomplete` hints, `aria-invalid`, and
  `aria-describedby` links to field errors.
- Authentication failures use `role="alert"`; the password visibility control exposes `aria-pressed`.
- Animation is limited to short transitions and is removed for users who prefer reduced motion.
- The layout remains usable from 320px upward and does not rely on hover.
- `bypassSecurityTrust` is not used. Direct DOM access is limited to the theme service, which sets a
  single attribute on the document root.

WCAG 2.2 AA is the target for the completed application. This stage establishes the baseline; each
later feature must preserve it.

## Testing

Vitest runs through the official Angular unit-test builder. The suite covers the root component,
application shell, sidebar, header, theme preference, overview screen, students placeholder, brand
mark input behavior, JWT decoding, API URL joining, session lifecycle, interceptor behavior, route
guards, and the login form.

```bash
npm test
```

Coverage is available with:

```bash
npm run test:coverage
```

## Git workflow

- `main` holds stable, reviewed work.
- `develop` is the integration branch.
- `feature/frontend-foundation` contains Stage 1.
- `feature/layout` contains Stage 2 and builds on the Stage 1 branch until the first pull request is
  merged.
- `feature/authentication` contains Stage 3 and builds on the layout branch.
- Future stages use one `feature/*` branch each and target `develop` through a pull request.

The frontend repository is independent from the backend repository. No backend files are modified by
this project.

## Stage 3 scope

Included:

- public sign-in route with a Signal Forms login form;
- email format, required, and length validation with accessible messages;
- JWT session handling with decoded email, role, and absolute expiry;
- session persistence in `localStorage` with expired-session cleanup;
- functional interceptor adding `Authorization: Bearer` and handling `401` responses;
- `authGuard` for the application shell and `guestGuard` for the login route;
- return-URL navigation after sign-in and after an expired session;
- mapped errors for invalid credentials, rate limiting, and an unreachable API;
- account email, role, and sign-out action in the shell header;
- login layout, responsive behavior, and shared danger tokens;
- unit tests, lint, and production build verification;
- project documentation updates.

Excluded:

- real student data, list, filters, pagination, or CRUD;
- role-based route permissions inside the students area;
- token refresh and multi-tab session synchronization.

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

The local backend runs at `http://localhost:3000`, with Swagger at
`http://localhost:3000/api/docs`. Student fields are `firstName`, `lastName`, `email`,
`documentNumber`, and `birthDate`; the list response wraps records in `data` with pagination
metadata in `meta`.

## Roadmap

1. **Foundation** — completed. Project setup, architecture, design tokens, and quality gates.
2. **Layout** — completed. Application shell, sidebar, header, navigation routes, and theme control.
3. **Authentication** — completed. Login, JWT handling, interceptors, and route protection.
4. **Student list** — next. Table, search, filters, and pagination.
5. **Student management** — create, read, update, and delete flows.
6. **Roles and permissions** — align the interface with backend access rules.
7. **Quality** — validation, errors, accessibility, responsiveness, and tests.
8. **Finalization** — documentation and deployment preparation.
