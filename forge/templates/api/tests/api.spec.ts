import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL   = process.env.API_BASE_URL   || 'http://localhost:3000';
const AUTH_TOKEN = process.env.API_AUTH_TOKEN || '';

// Retry the health endpoint until the API is ready (guards against cold starts).
async function waitForApi(retries = 15, delayMs = 2000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return;
    } catch {
      // not yet reachable
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error(`API at ${BASE_URL} did not become ready after ${retries} retries`);
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) base['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  return { ...base, ...extra };
}

describe('API', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('GET /health returns 200 with status ok', async () => {
    const res  = await fetch(`${BASE_URL}/health`);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('POST /items creates a resource and GET /items returns it', async () => {
    const created = await fetch(`${BASE_URL}/items`, {
      method:  'POST',
      headers: headers(),
      body:    JSON.stringify({ name: 'API test item' }),
    });

    expect(created.status).toBe(201);
    const item = await created.json() as Record<string, unknown>;
    expect(item).toHaveProperty('id');
    expect(item.name).toBe('API test item');

    const listed  = await fetch(`${BASE_URL}/items`, { headers: headers() });
    const items   = await listed.json() as Array<Record<string, unknown>>;

    expect(listed.status).toBe(200);
    expect(Array.isArray(items)).toBe(true);
    expect(items.some(i => i.id === item.id)).toBe(true);
  });

  it('POST /items with missing name returns 400', async () => {
    const res = await fetch(`${BASE_URL}/items`, {
      method:  'POST',
      headers: headers(),
      body:    JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  it('GET /items without auth token returns 401', async () => {
    // Only meaningful when AUTH_TOKEN is set — skip if the API has no auth.
    if (!AUTH_TOKEN) return;

    const res = await fetch(`${BASE_URL}/items`, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status).toBe(401);
  });
});
