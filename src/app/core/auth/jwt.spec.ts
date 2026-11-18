import { decodeJwtPayload } from './jwt';

function encodePayload(payload: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  const base64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `header.${base64}.signature`;
}

describe('decodeJwtPayload', () => {
  it('should decode the payload claims', () => {
    const token = encodePayload({
      sub: 'user-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      exp: 1893456000,
    });

    expect(decodeJwtPayload(token)).toEqual({
      sub: 'user-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      exp: 1893456000,
    });
  });

  it('should decode unicode email claims', () => {
    const token = encodePayload({ email: 'josé@example.com', role: 'USER' });

    expect(decodeJwtPayload(token)?.email).toBe('josé@example.com');
  });

  it('should return null for malformed tokens', () => {
    expect(decodeJwtPayload('not-a-token')).toBeNull();
    expect(decodeJwtPayload('header.%%%.signature')).toBeNull();
    expect(decodeJwtPayload('header.bnVsbA.signature')).toBeNull();
    expect(decodeJwtPayload('header.bnVtYmVy.signature')).toBeNull();
  });
});
