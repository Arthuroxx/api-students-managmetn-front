# Deployment

The application builds to a static single-page application. Any static host can serve it; a
reverse proxy is only required to reach the API on the same origin.

## Build

```bash
npm ci
npm run build
```

`npm run build` runs the `prebuild` step, which generates the production environment from
`API_BASE_URL` (see [configuration.md](./configuration.md)), and then compiles the application.
The output is written to:

```text
dist/students-management-frontend/browser
```

## Build output

| Entry                           | Cache policy                             |
| ------------------------------- | ---------------------------------------- |
| `index.html`                    | `no-cache` (revalidate on every request) |
| Hashed assets (`*.js`, `*.css`) | `public, max-age=31536000, immutable`    |
| `favicon.svg`, `robots.txt`     | short or no caching                      |

## Static hosting requirements

1. **SPA fallback.** Rewrite unknown paths to `/index.html` so client-side routes resolve on
   refresh and on deep links.
2. **Caching.** Hash-named assets are immutable; `index.html` must not be cached.
3. **Compression.** Serve gzip or Brotli.
4. **HTTPS.** Required in production; the API should be served over HTTPS as well.

## Same-origin deployment (recommended)

Serve the static build and forward the API paths to the backend. Example nginx server:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    location /auth/    { proxy_pass http://api:3000; }
    location /students { proxy_pass http://api:3000; }
    location /health   { proxy_pass http://api:3000; }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

`API_BASE_URL` stays empty, so the browser calls the same origin and no CORS rules are needed.

## Separate-origin deployment

Build with the API origin and allow the frontend origin on the backend:

```bash
API_BASE_URL=https://api.example.com npm run build
```

Set `CORS_ORIGINS=https://app.example.com` on the backend. See
[configuration.md](./configuration.md).

## Container image

The `Dockerfile` builds the application with Node.js and serves it with nginx.
`nginx.conf.template` provides the SPA fallback, cache headers, compression, and security
headers.

```bash
docker build -t students-management-frontend --build-arg API_BASE_URL= .
docker run --rm -p 8080:80 students-management-frontend
```

Open `http://localhost:8080`. The image exposes port `80` and includes a `GET /` health check.

The `API_BASE_URL` build argument has two effects: it is baked into the frontend bundle, and the
container start script substitutes it into the `Content-Security-Policy` `connect-src` value in
`nginx.conf.template`. A single value therefore configures both the client and the CSP.

For a separate API origin, pass the same origin at build time:

```bash
docker build -t students-management-frontend --build-arg API_BASE_URL=https://api.example.com .
docker run --rm -p 8080:80 students-management-frontend
```

The image stores the build value as an environment variable, so the CSP is correct without extra
flags. If you must point an existing image at a different API origin at runtime, override it with
`-e API_BASE_URL=https://api.example.com`; the bundle still calls the origin it was built with, so
rebuilding is the recommended path.

## Security headers

`nginx.conf.template` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
`Permissions-Policy`, and a `Content-Security-Policy`. Enable HTTP Strict Transport Security at
the TLS terminator.

The CSP allows `connect-src 'self'` plus the configured `API_BASE_URL`, so the browser can reach
the API whether it shares the frontend origin or lives on a different host. No wildcard is used.
The value is rendered into the config at container start; outside the container, substitute
`${API_BASE_URL}` yourself or edit `connect-src` directly.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes and pull requests: install, lint, format check, unit
tests, production build, and a container image build. It does not push or deploy anything. Add
a deployment step for your host after the quality job passes.

## Rollback

Builds are immutable and self-contained. To roll back, redeploy the previous artifact or image
tag; no database or frontend migration is involved.
