# Configuration

The frontend is configured at build time. The production bundle contains no secrets and reads
no runtime environment variables.

## Configuration contract

`src/environments/environment.model.ts` defines the typed contract:

```ts
export interface Environment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
}
```

`src/app/core/config/api-config.ts` exposes the value through the `API_BASE_URL` injection
token. Feature services inject the token and join it with relative endpoints through
`buildApiUrl()`; they never import the environment file directly. See the
[HTTP and API configuration](../README.md#http-and-api-configuration) section of the README.

## Environment files

| File                         | Used by                                   | `apiBaseUrl`                                |
| ---------------------------- | ----------------------------------------- | ------------------------------------------- |
| `environment.development.ts` | Development server and development builds | `http://localhost:3000`                     |
| `environment.ts`             | Default fallback for tests and tooling    | empty (same origin)                         |
| `environment.production.ts`  | Production builds                         | generated from `API_BASE_URL` (Git-ignored) |

`angular.json` selects the file through `fileReplacements`:

- the `development` configuration replaces `environment.ts` with `environment.development.ts`;
- the `production` configuration replaces `environment.ts` with the generated
  `environment.production.ts`.

## Build-time variables

| Variable       | Required | Default | Description                                                                                                           |
| -------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `API_BASE_URL` | No       | empty   | Absolute `http(s)` origin of the API, without a trailing slash. An empty value keeps requests on the frontend origin. |

`scripts/generate-environment.mjs` reads the variable and writes
`src/environments/environment.production.ts` before each production build. Precedence is:

1. the value exported in the shell or CI environment;
2. the value in a local `.env` file;
3. the empty default.

The generator rejects values that are neither empty nor a valid `http(s)` origin, and it
removes any trailing slash before writing the file.

## Local `.env` file

```bash
cp .env.example .env
```

`.env` is Git-ignored. Set `API_BASE_URL` there for a production build against a separate API
origin. On PowerShell, use `Copy-Item .env.example .env`.

## Same origin versus separate origin

**Same origin (default).** Leave `API_BASE_URL` empty. A reverse proxy serves the static build
and forwards the API paths (`/auth`, `/students`, `/health`) to the backend. No CORS
configuration is needed. This is the recommended production topology; see
[deployment.md](./deployment.md).

**Separate origin.** Set `API_BASE_URL=https://api.example.com` and add the frontend origin to
the backend's `CORS_ORIGINS`. The container image also uses this value to allow the origin in its
`Content-Security-Policy`; see [deployment.md](./deployment.md).

## Secrets

Never place credentials, JWT secrets, database URLs, or private keys in the frontend
configuration, in `.env`, or in the bundle. The only value the frontend needs is the public API
base URL. Everything shipped in the bundle is downloadable by any visitor.
