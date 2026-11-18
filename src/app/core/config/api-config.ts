import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Base URL for the Student Management API.
 *
 * No HTTP calls are made in the foundation stage. Feature services will inject
 * this token instead of reading the environment directly.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
