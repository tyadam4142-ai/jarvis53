import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const PUBLIC_ORIGIN = 'https://jarvis53.dynamicrobotics53.com';
const ADMIN_ORIGIN = 'https://53.jarvis53.dynamicrobotics53.com';

class FakeDB {
  constructor() {
    this.rows = new Map(); // simple key-value emulation for settings lookups
  }
  prepare(sql) {
    const stmt = {
      sql,
      bind() { return stmt; },
      async first() {
        if (/SELECT 1 AS ok/i.test(sql)) return { ok: 1 };
        if (/SELECT value FROM settings WHERE key=\?/i.test(sql)) return this._setting ?? null;
        return null;
      },
      async all() { return { results: [] }; },
      async run() { return { success: true, meta: { changes: 1 } }; },
    };
    return stmt;
  }
}
function env(overrides = {}) {
  return {
    DB: new FakeDB(),
    PUBLIC_ORIGIN,
    ADMIN_ORIGIN,
    DEFAULT_MONTHLY_PRICE: '553',
    DEFAULT_ANNUAL_PRICE: '5530',
    DEFAULT_PAYMENT_INSTRUCTIONS: 'Ask Dynamic Robotics for payment instructions.',
    ASSETS: { async fetch() { return new Response('<admin>', { headers: { 'content-type': 'text/html' } }); } },
    ...overrides,
  };
}

test('health endpoint checks the shared database and reports the live version', async () => {
  const res = await worker.fetch(new Request(`${ADMIN_ORIGIN}/api/health`), env());
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, service: 'jarvis53-control-plane', database: 'connected', version: '2.9.0' });
});

test('public activation configuration comes from the shared service with no UPI surface', async () => {
  const res = await worker.fetch(new Request(`${ADMIN_ORIGIN}/api/activation/request`, { headers: { Origin: PUBLIC_ORIGIN } }), env());
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.monthlyPrice, 553);
  assert.equal(data.annualPrice, 5530);
  assert.equal(data.defaultPlan, 'all-access');
  assert.equal(res.headers.get('access-control-allow-origin'), PUBLIC_ORIGIN);
  // BUG-102/BUG-201: UPI has been removed product-wide.
  assert.equal('upiId' in data, false);
  assert.equal(Object.keys(data).some((k) => /upi/i.test(k)), false);
});

test('activation POST rejects an unexpected browser origin', async () => {
  const res = await worker.fetch(new Request(`${ADMIN_ORIGIN}/api/activation/request`, {
    method: 'POST', headers: { Origin: 'https://attacker.invalid', 'content-type': 'application/json' }, body: '{}',
  }), env());
  assert.equal(res.status, 403);
});

test('activation POST with a localhost origin requires a real transaction reference', async () => {
  // A syntactically valid body but a reference shorter than 4 chars must be rejected
  // with the UPI-free manual-verification copy (BUG-101/BUG-201).
  const res = await worker.fetch(new Request(`${ADMIN_ORIGIN}/api/activation/request`, {
    method: 'POST',
    headers: { Origin: 'http://localhost:3000', 'content-type': 'application/json' },
    body: JSON.stringify({ phone: '+919876543210', accessToken: 'a'.repeat(64), paymentRef: 'ab' }),
  }), env());
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /payment transaction reference/i);
  assert.doesNotMatch(data.error, /upi/i);
});

test('admin APIs require a valid session', async () => {
  const res = await worker.fetch(new Request(`${ADMIN_ORIGIN}/api/admin/stats`), env());
  assert.equal(res.status, 401);
});

test('admin settings POST cannot resurrect the removed UPI field', async () => {
  // Without a session this is 401 — the point is that no upiId handling exists in code.
  const src = await import('../src/index.js');
  const moduleText = (await import('node:fs')).readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.equal(/upi/i.test(moduleText.replace(/\/\/[^\n]*/g, '')), false, 'worker source must not reference UPI');
  assert.notEqual(src, null);
});

test('admin page returns clickjacking and CSP protections', async () => {
  const res = await worker.fetch(new Request(`${ADMIN_ORIGIN}/admin`), env());
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.match(res.headers.get('content-security-policy') || '', /frame-ancestors 'none'/);
  assert.equal(await res.text(), '<admin>');
});

test('chat is rejected until an authenticated phone/token is supplied', async () => {
  const res = await worker.fetch(new Request(`${ADMIN_ORIGIN}/api/chat`, {
    method: 'POST', headers: { Origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify({ text: 'hello' }),
  }), env());
  assert.equal(res.status, 400);
});

test('new coding tools are inside the worker tool allowlist', async () => {
  const moduleText = (await import('node:fs')).readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  for (const tool of ['files.edit', 'files.search_content', 'dev.run_command', 'dev.inspect_project']) {
    assert.ok(moduleText.includes(`'${tool}'`), `ALLOWED_TOOLS must contain ${tool}`);
  }
});
