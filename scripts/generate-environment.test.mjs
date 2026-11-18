// Tests for the production environment generator. Run with `npm run test:scripts`.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeApiBaseUrl, renderEnvironmentFile } from './generate-environment.mjs';

/** Evaluates the exported `environment` object from a generated module source. */
function readGeneratedEnvironment(source) {
  const marker = 'export const environment: Environment =';
  const start = source.indexOf('{', source.indexOf(marker));
  const end = source.lastIndexOf('}');
  return new Function(`return (${source.slice(start, end + 1)});`)();
}

test('normalizeApiBaseUrl accepts an empty value as same origin', () => {
  assert.deepEqual(normalizeApiBaseUrl(''), { apiBaseUrl: '', error: null });
  assert.deepEqual(normalizeApiBaseUrl('   '), { apiBaseUrl: '', error: null });
});

test('normalizeApiBaseUrl trims a trailing slash', () => {
  assert.deepEqual(normalizeApiBaseUrl('https://api.example.com/'), {
    apiBaseUrl: 'https://api.example.com',
    error: null,
  });
});

test('normalizeApiBaseUrl rejects a non-http protocol', () => {
  const result = normalizeApiBaseUrl('ftp://api.example.com');
  assert.equal(result.apiBaseUrl, 'ftp://api.example.com');
  assert.match(result.error ?? '', /protocol/);
});

test('normalizeApiBaseUrl rejects a value that is not a URL', () => {
  const result = normalizeApiBaseUrl('not a url');
  assert.ok(result.error);
});

test('renderEnvironmentFile round-trips a plain origin', () => {
  const source = renderEnvironmentFile('https://api.example.com');
  assert.deepEqual(readGeneratedEnvironment(source), {
    production: true,
    apiBaseUrl: 'https://api.example.com',
  });
});

test('renderEnvironmentFile escapes quotes and special characters', () => {
  const hostile = `https://api.example.com/'; process.exit(1); //\n"quote"\\tail`;
  const source = renderEnvironmentFile(hostile);

  // The literal stays on one line and evaluates to the exact input, so it cannot
  // break the generated module or inject code.
  assert.deepEqual(readGeneratedEnvironment(source), { production: true, apiBaseUrl: hostile });
  assert.equal(source.split('\n').filter((line) => line.includes('apiBaseUrl:')).length, 1);
});

test('renderEnvironmentFile uses JSON.stringify for the value', () => {
  const source = renderEnvironmentFile("https://api.example.com/a'b");
  assert.ok(source.includes(`apiBaseUrl: ${JSON.stringify("https://api.example.com/a'b")},`));
});
