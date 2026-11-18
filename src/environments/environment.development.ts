import type { Environment } from './environment.model';

/**
 * Local development defaults. The API runs on port 3000 by default.
 */
export const environment: Environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
};
