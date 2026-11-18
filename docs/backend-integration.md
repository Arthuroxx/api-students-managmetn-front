# Backend integration verification

The frontend is a client of the Student Management API. This guide explains how the two connect
and how to verify the integration. The full API contract is documented in the README's
[Backend reference](../README.md#backend-reference) section and in the backend repository.

## Connection model

The client resolves every request against `API_BASE_URL` (see
[configuration.md](./configuration.md)). Two topologies are supported:

- **Same origin (default).** `API_BASE_URL` is empty and a reverse proxy forwards the API paths
  to the backend. No CORS configuration is required.
- **Separate origin.** `API_BASE_URL` points at the API and the backend lists the frontend
  origin in `CORS_ORIGINS`.

In both cases the browser sends `Authorization: Bearer <token>` on protected requests.

## UI to endpoint map

| Interface action      | Endpoint               | Required role   |
| --------------------- | ---------------------- | --------------- |
| Sign in               | `POST /auth/login`     | Public          |
| Directory and filters | `GET /students`        | `ADMIN`, `USER` |
| Student detail        | `GET /students/:id`    | `ADMIN`, `USER` |
| Create student        | `POST /students`       | `ADMIN`         |
| Edit student          | `PATCH /students/:id`  | `ADMIN`         |
| Delete student        | `DELETE /students/:id` | `ADMIN`         |
| API liveness          | `GET /health`          | Public          |

Request and response shapes, query parameters, and status codes are in the README's backend
reference.

## Error handling

| Status | Client behaviour                                                                   |
| ------ | ---------------------------------------------------------------------------------- |
| `401`  | Session cleared, redirect to `/login` with a return URL.                           |
| `403`  | Session kept, actionable permission message; write controls are hidden for `USER`. |
| `404`  | Record removed or invalid link; a "not found" state is shown.                      |
| `409`  | Duplicate email or document number message in the editor.                          |
| `0`    | "API unreachable" message with a retry action.                                     |

## Prerequisites

- The backend is running (`http://localhost:3000` by default).
- `CORS_ORIGINS` includes the frontend origin for a separate-origin setup.
- An `ADMIN` user exists, created by the backend seed.

## Automated smoke test (development only)

`scripts/verify-integration.mjs` exercises the integration end to end. It refuses to run
against a non-local host, creates a student with unique data, and deletes it in a `finally`
block so the database is left clean.

```bash
SMOKE_ADMIN_EMAIL=admin@example.com SMOKE_ADMIN_PASSWORD=change_me npm run verify:integration
```

On PowerShell:

```powershell
$env:SMOKE_ADMIN_EMAIL = 'admin@example.com'
$env:SMOKE_ADMIN_PASSWORD = 'change_me'
npm run verify:integration
```

| Variable               | Required | Default                 | Description                                             |
| ---------------------- | -------- | ----------------------- | ------------------------------------------------------- |
| `SMOKE_API_BASE_URL`   | No       | `http://localhost:3000` | API origin; must be `localhost`, `127.0.0.1`, or `::1`. |
| `SMOKE_ADMIN_EMAIL`    | Yes      | —                       | Email of the seeded `ADMIN` user.                       |
| `SMOKE_ADMIN_PASSWORD` | Yes      | —                       | Password of the seeded `ADMIN` user.                    |
| `SMOKE_USER_EMAIL`     | No       | —                       | Enables the read-only `403` check.                      |
| `SMOKE_USER_PASSWORD`  | No       | —                       | Password for the read-only user.                        |

The script verifies health, login, create, filtered list, read, update, delete, the post-delete
`404`, and the unauthenticated `401`. It exits with a non-zero code if any check fails.

## Manual checklist

- [ ] `GET /health` returns `200` with `database: "up"`.
- [ ] Sign in as `ADMIN`; the overview and the directory load.
- [ ] Filter by first name, last name, and email; pagination and page size work.
- [ ] Create, open, edit, and delete a student; deletion asks for confirmation.
- [ ] Sign in as `USER`; management controls are hidden and `/students/new` redirects to
      `/forbidden`.
- [ ] With an expired or removed token, the next request redirects to `/login`.
- [ ] With the API stopped, the directory shows the "unreachable" state with a retry action.
