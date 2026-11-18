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
