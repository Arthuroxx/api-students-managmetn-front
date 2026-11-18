export interface DecodedJwtPayload {
  readonly sub?: string;
  readonly email?: string;
  readonly role?: string;
  readonly exp?: number;
}

/**
 * Decodes the payload segment of a JWT without verifying its signature.
 *
 * The API is the only authority on whether a token is valid; the client only
 * reads the claims needed to personalize the interface. Invalid or malformed
 * tokens return `null` instead of throwing.
 */
export function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  const payload = token.split('.')[1];

  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));

    return isDecodedJwtPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isDecodedJwtPayload(value: unknown): value is DecodedJwtPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate['sub'] === undefined || typeof candidate['sub'] === 'string') &&
    (candidate['email'] === undefined || typeof candidate['email'] === 'string') &&
    (candidate['role'] === undefined || typeof candidate['role'] === 'string') &&
    (candidate['exp'] === undefined || typeof candidate['exp'] === 'number')
  );
}
