// Development-only integration smoke test for the Student Management API.
//
// It exercises the same endpoints the frontend uses, with unique data that is removed in a
// `finally` block. The script refuses to run against a non-local host and exits with a non-zero
// code when any check fails. See docs/backend-integration.md.

const baseUrl = (process.env.SMOKE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const adminEmail = process.env.SMOKE_ADMIN_EMAIL;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD;
const userEmail = process.env.SMOKE_USER_EMAIL;
const userPassword = process.env.SMOKE_USER_PASSWORD;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const results = [];
let createdId = null;

function assert(condition, message) {
  results.push({ ok: Boolean(condition), message });
  if (!condition) {
    throw new Error(message);
  }
}

async function request(method, path, { token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  return { status: response.status, json };
}

function requireConfig() {
  const missing = [];
  if (!adminEmail) missing.push('SMOKE_ADMIN_EMAIL');
  if (!adminPassword) missing.push('SMOKE_ADMIN_PASSWORD');
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}.`);
  }
}

function guardLocalOnly() {
  let host;
  try {
    host = new URL(baseUrl).hostname;
  } catch {
    throw new Error(`Invalid SMOKE_API_BASE_URL: "${baseUrl}".`);
  }

  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `Refusing to run against non-local host "${host}". The smoke test is for development only.`,
    );
  }
}

async function login(email, password) {
  const response = await request('POST', '/auth/login', { body: { email, password } });
  assert(response.status === 200, `POST /auth/login returns 200 (received ${response.status}).`);
  assert(
    typeof response.json?.accessToken === 'string' && response.json.accessToken.length > 0,
    'Login response includes an access token.',
  );
  return response.json.accessToken;
}

async function main() {
  guardLocalOnly();
  requireConfig();

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const student = {
    firstName: `Smoke${suffix}`,
    lastName: 'Integration',
    email: `smoke.${suffix}@example.com`,
    documentNumber: `SMK-${suffix}`,
    birthDate: '2000-01-01',
  };

  try {
    const health = await request('GET', '/health');
    assert(health.status === 200, `GET /health returns 200 (received ${health.status}).`);

    const adminToken = await login(adminEmail, adminPassword);

    const created = await request('POST', '/students', { token: adminToken, body: student });
    assert(created.status === 201, `POST /students returns 201 (received ${created.status}).`);
    assert(
      typeof created.json?.id === 'string' || typeof created.json?.id === 'number',
      'Created student response includes an id.',
    );
    createdId = created.json.id;

    const filtered = await request(
      'GET',
      `/students?firstName=${encodeURIComponent(student.firstName)}`,
      { token: adminToken },
    );
    assert(filtered.status === 200, `GET /students returns 200 (received ${filtered.status}).`);
    assert(
      Array.isArray(filtered.json?.data) && filtered.json.data.length >= 1,
      'Filtered list contains the created student.',
    );

    const detail = await request('GET', `/students/${createdId}`, { token: adminToken });
    assert(detail.status === 200, `GET /students/:id returns 200 (received ${detail.status}).`);

    const updated = await request('PATCH', `/students/${createdId}`, {
      token: adminToken,
      body: { lastName: 'IntegrationUpdated' },
    });
    assert(updated.status === 200, `PATCH /students/:id returns 200 (received ${updated.status}).`);
    assert(
      updated.json?.lastName === 'IntegrationUpdated',
      'PATCH /students/:id persists the change.',
    );

    const removed = await request('DELETE', `/students/${createdId}`, { token: adminToken });
    assert(
      removed.status === 200 || removed.status === 204,
      `DELETE /students/:id returns 200 or 204 (received ${removed.status}).`,
    );
    createdId = null;

    const missing = await request('GET', `/students/${created.json.id}`, { token: adminToken });
    assert(missing.status === 404, `Deleted student returns 404 (received ${missing.status}).`);

    const anonymous = await request('GET', '/students');
    assert(
      anonymous.status === 401,
      `Unauthenticated GET /students returns 401 (received ${anonymous.status}).`,
    );

    if (userEmail && userPassword) {
      const userToken = await login(userEmail, userPassword);
      const denied = await request('POST', '/students', { token: userToken, body: student });
      assert(denied.status === 403, `USER POST /students returns 403 (received ${denied.status}).`);
    } else {
      results.push({ ok: true, message: 'Read-only 403 check skipped (no USER credentials).' });
    }
  } finally {
    if (createdId !== null) {
      try {
        const token = await login(adminEmail, adminPassword);
        await request('DELETE', `/students/${createdId}`, { token });
      } catch {
        // Best-effort cleanup; the failure is reported through the check results below.
      }
    }
  }

  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.message}`);
  }
  console.log(`\nIntegration smoke test passed (${results.length} checks).`);
}

main().catch((error) => {
  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.message}`);
  }
  console.error(`\nIntegration smoke test failed: ${error.message}`);
  process.exit(1);
});
