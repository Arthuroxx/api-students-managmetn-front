// Tests for the nginx configuration template. Run with `npm run test:scripts`.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const templatePath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'nginx.conf.template');
const template = readFileSync(templatePath, 'utf8');

function contentSecurityPolicies() {
  return [...template.matchAll(/Content-Security-Policy "([^"]+)"/g)].map((match) => match[1]);
}

test('every Content-Security-Policy allows the configured API origin', () => {
  const policies = contentSecurityPolicies();
  assert.ok(policies.length >= 1, 'the template declares at least one CSP');
  for (const policy of policies) {
    assert.match(policy, /connect-src 'self' \$\{API_BASE_URL\}/);
  }
});

test('the Content-Security-Policy never uses a wildcard source', () => {
  for (const policy of contentSecurityPolicies()) {
    assert.ok(!policy.includes('*'), `unexpected wildcard in: ${policy}`);
  }
});

test('an empty API origin keeps connect-src on the same origin', () => {
  const rendered = template.replaceAll('${API_BASE_URL}', '');
  assert.match(rendered, /connect-src 'self' ;/);
  assert.ok(!rendered.includes('${API_BASE_URL}'));
});

test('a separate API origin is appended to connect-src', () => {
  const rendered = template.replaceAll('${API_BASE_URL}', 'https://api.example.com');
  assert.match(rendered, /connect-src 'self' https:\/\/api\.example\.com;/);
});

test('nginx variables are preserved for the substitution step', () => {
  const rendered = template.replaceAll('${API_BASE_URL}', 'https://api.example.com');
  assert.match(rendered, /try_files \$uri \$uri\/ \/index\.html;/);
});
