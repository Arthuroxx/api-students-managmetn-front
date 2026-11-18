# Installation guide

This guide covers installing, running, and verifying the Student Management frontend on a
local machine. For the architecture, project structure, and design decisions, see the
[project README](../README.md). This guide links to it instead of repeating it.

## Prerequisites

| Tool    | Version                               | Notes                                          |
| ------- | ------------------------------------- | ---------------------------------------------- |
| Node.js | `^22.22.3`, `^24.15.0`, or `>=26.0.0` | Matches the `engines` field in `package.json`. |
| npm     | 11 or newer                           | `package-lock.json` is the source of truth.    |
| Docker  | Current release                       | Optional. Only for the production container in |
|         |                                       | [deployment.md](./deployment.md).              |

The sign-in flow needs the backend API. The rest of the interface, including validation and
session restoration, can be reviewed without it. The backend is a separate repository and is
not modified by this project.

## 1. Clone and install

```bash
git clone <frontend-repository-url>
cd students-management-frontend
npm install
```

Use `npm ci` in automated environments; it installs the exact versions from
`package-lock.json`.

## 2. Start the development server

```bash
npm start
```

Open `http://localhost:4200`. The server reloads when source files change. The development
configuration points the API base URL at `http://localhost:3000`; see
[configuration.md](./configuration.md).

## 3. Connect to the backend

1. Start the Student Management API on `http://localhost:3000`.
2. Add the frontend origin to the backend's `CORS_ORIGINS`, for example
   `CORS_ORIGINS=http://localhost:4200`.
3. Sign in with the seeded `ADMIN` credentials.

Without step 2 the browser blocks the login request. See
[backend-integration.md](./backend-integration.md) for the full checklist.

## 4. Run the quality gates

```bash
npm run lint
npm run format:check
npm test
npm run test:scripts
npm run build
```

## 5. Preview a production build

```bash
npm run build
npx serve -s dist/students-management-frontend/browser
```

`npx serve` is downloaded on first use and is not a project dependency. The `-s` flag enables
the single-page-application fallback so deep links resolve. The Docker image described in
[deployment.md](./deployment.md) provides the same behaviour with the production web server.

## Troubleshooting

### The browser blocks the login request

The backend `CORS_ORIGINS` does not include the frontend origin. Add `http://localhost:4200`
and restart the API.

### Deep links return 404 in a static preview

The preview server does not apply the SPA fallback. Use `npx serve -s`, or the nginx container
in [deployment.md](./deployment.md).

### The build reports a missing `environment.production.ts`

Run `npm run build`, which generates the file, instead of `ng build` directly. See
[configuration.md](./configuration.md).

### `npm install` warns about the Node.js version

Install a supported Node.js release. The `engines` field in `package.json` lists the accepted
versions.
