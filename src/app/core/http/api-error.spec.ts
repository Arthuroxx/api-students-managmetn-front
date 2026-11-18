import { HttpErrorResponse } from '@angular/common/http';
import { UNREACHABLE_API_MESSAGE, describeApiError, readApiErrorMessage } from './api-error';

function httpError(status: number, body: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body });
}

describe('readApiErrorMessage', () => {
  it('reads a string message from the envelope', () => {
    expect(readApiErrorMessage({ statusCode: 400, message: 'Bad request' })).toBe('Bad request');
  });

  it('reads the first entry of a message array', () => {
    expect(readApiErrorMessage({ message: ['First', 'Second'] })).toBe('First');
  });

  it('returns null when no usable message is present', () => {
    expect(readApiErrorMessage(null)).toBeNull();
    expect(readApiErrorMessage('oops')).toBeNull();
    expect(readApiErrorMessage({ message: 42 })).toBeNull();
    expect(readApiErrorMessage({ message: [] })).toBeNull();
  });
});

describe('describeApiError', () => {
  it('returns the fallback for non-HTTP errors', () => {
    expect(describeApiError(new Error('boom'), { fallback: 'Fallback message' })).toBe(
      'Fallback message',
    );
  });

  it('reports the API as unreachable for status 0', () => {
    expect(
      describeApiError(httpError(0), {
        fallback: 'Fallback message',
        byStatus: { 0: 'Ignored' },
      }),
    ).toBe(UNREACHABLE_API_MESSAGE);
  });

  it('prefers the mapped status message over the API envelope', () => {
    expect(
      describeApiError(httpError(403, { message: 'Forbidden' }), {
        fallback: 'Fallback message',
        byStatus: { 403: 'Mapped permission message' },
      }),
    ).toBe('Mapped permission message');
  });

  it('falls back to the API envelope when the status is not mapped', () => {
    expect(
      describeApiError(httpError(500, { message: 'Database unavailable' }), {
        fallback: 'Fallback message',
      }),
    ).toBe('Database unavailable');
  });

  it('uses the unmapped fallback when there is no API message', () => {
    expect(
      describeApiError(httpError(500), {
        fallback: 'Generic fallback',
        unmappedFallback: 'HTTP fallback',
      }),
    ).toBe('HTTP fallback');
  });

  it('prefers the API envelope for statuses listed in preferApiMessageFor', () => {
    const messages = {
      fallback: 'Fallback message',
      byStatus: { 409: 'Mapped conflict message' },
      preferApiMessageFor: [409],
    };

    expect(describeApiError(httpError(409, { message: 'Email already exists' }), messages)).toBe(
      'Email already exists',
    );
    expect(describeApiError(httpError(409), messages)).toBe('Mapped conflict message');
  });
});
