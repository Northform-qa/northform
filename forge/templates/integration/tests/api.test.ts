import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.API_URL ?? 'http://localhost:3000';

// Retry loop — healthcheck passes before tests run, but a retry guard here
// protects against the small window where the API is up but not yet ready.
async function waitForHealth(maxAttempts = 30, intervalMs = 2_000): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return;
    } catch {
      // connection refused — service not yet ready
    }
    if (attempt < maxAttempts) await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`API at ${BASE_URL} did not become healthy after ${maxAttempts} attempts`);
}

describe('Integration: API', () => {
  beforeAll(async () => {
    await waitForHealth();
  }, 120_000);

  describe('GET /health', () => {
    it('returns 200 with db and cache status ok', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);

      const body = await res.json() as { status: string; db: string; cache: string };
      expect(body.status).toBe('ok');
      expect(body.db).toBe('ok');
      expect(body.cache).toBe('ok');
    });
  });

  describe('POST /items + GET /items', () => {
    it('creates an item and returns it in the list', async () => {
      const itemName = `test-item-${Date.now()}`;

      const createRes = await fetch(`${BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: itemName }),
      });
      expect(createRes.status).toBe(201);

      const created = await createRes.json() as { id: number; name: string };
      expect(created.name).toBe(itemName);
      expect(created.id).toBeTypeOf('number');

      const listRes = await fetch(`${BASE_URL}/items`);
      expect(listRes.status).toBe(200);

      const items = await listRes.json() as Array<{ id: number; name: string }>;
      expect(items.some(item => item.id === created.id)).toBe(true);
    });

    it('returns 400 when name is missing', async () => {
      const res = await fetch(`${BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });
});
