import { HttpErrorResponse } from '@angular/common/http';

/**
 * Reads a human-readable message from the API error envelope:
 * `{ statusCode, message, error }`, where `message` may also be a string array.
 */
export function readApiErrorMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const message = (body as Record<string, unknown>)['message'];

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }

  return null;
}

/** Shared copy for the network failure mode, where no response reaches the client. */
export const UNREACHABLE_API_MESSAGE =
  'The API is unreachable. Check that it is running and try again.';

/**
 * Message set used by {@link describeApiError}. Each feature supplies its own copy
 * so the same resolution rules apply to every API failure in the application.
 */
export interface ApiErrorMessages {
  /** Used for non-HTTP errors (unexpected runtime failures). */
  readonly fallback: string;
  /** Per-status messages. Status `0` always resolves to {@link UNREACHABLE_API_MESSAGE}. */
  readonly byStatus?: Readonly<Record<number, string>>;
  /**
   * Statuses where the API envelope message takes priority over `byStatus`.
   * Used when the server message is more specific than a generic status message,
   * such as validation or conflict responses.
   */
  readonly preferApiMessageFor?: readonly number[];
  /** Used for HTTP errors without a mapped status or API message. Defaults to `fallback`. */
  readonly unmappedFallback?: string;
}

/**
 * Resolves an actionable message for any API failure. It normalizes the order in
 * which the API envelope, the mapped status message, and the feature fallbacks are
 * consulted, so every caller reports errors consistently.
 */
export function describeApiError(error: unknown, messages: ApiErrorMessages): string {
  if (!(error instanceof HttpErrorResponse)) {
    return messages.fallback;
  }

  if (error.status === 0) {
    return UNREACHABLE_API_MESSAGE;
  }

  const apiMessage = readApiErrorMessage(error.error);
  const statusMessage = messages.byStatus?.[error.status];

  if (apiMessage && messages.preferApiMessageFor?.includes(error.status)) {
    return apiMessage;
  }

  return statusMessage ?? apiMessage ?? messages.unmappedFallback ?? messages.fallback;
}
