# Multi-stage build: compile the Angular application, then serve the static output with nginx.
# See docs/deployment.md.

# Build-time API origin. It is baked into the bundle and reused at container start as the
# Content-Security-Policy `connect-src` value. Leave empty when the API shares the origin.
ARG API_BASE_URL=

# --- Build stage ---
FROM node:24-alpine AS build

ARG API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL

WORKDIR /app

# Install dependencies from the lockfile only, so the image build is reproducible.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the sources and generate the production environment from API_BASE_URL.
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM nginx:alpine AS runtime

# The same value drives the CSP at container start. Override it with `-e API_BASE_URL=...`
# only when the runtime API origin differs from the build-time one.
ARG API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL
# Substitute only API_BASE_URL into the config template; leave nginx variables untouched.
ENV NGINX_ENVSUBST_FILTER=^API_BASE_URL$

# The entrypoint renders this template into /etc/nginx/conf.d/default.conf.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/students-management-frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
