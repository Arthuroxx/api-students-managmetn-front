import { buildApiUrl } from './api-url';

describe('buildApiUrl', () => {
  it('should join an absolute base URL with an endpoint', () => {
    expect(buildApiUrl('http://localhost:3000', 'auth/login')).toBe(
      'http://localhost:3000/auth/login',
    );
  });

  it('should normalize duplicate and missing slashes', () => {
    expect(buildApiUrl('http://localhost:3000/', '/auth/login')).toBe(
      'http://localhost:3000/auth/login',
    );
    expect(buildApiUrl('  http://localhost:3000///  ', '  /students  ')).toBe(
      'http://localhost:3000/students',
    );
  });

  it('should produce a root-relative URL for an empty base URL', () => {
    expect(buildApiUrl('', 'students')).toBe('/students');
    expect(buildApiUrl('   ', '/students')).toBe('/students');
  });
});
