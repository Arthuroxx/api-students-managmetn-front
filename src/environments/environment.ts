import type { Environment } from './environment.model';

/**
 * Production defaults.
 *
 * An empty base URL keeps requests on the application origin, which is the
 * expected setup when a reverse proxy serves the API and the frontend from the
 * same host. Replace this file per deployment when they live on different
 * origins.
 */
export const environment: Environment = {
  production: true,
  apiBaseUrl: '',
};
