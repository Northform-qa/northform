'use strict';

// Demo API stub — not production code.
// Replace this with the client's actual service or a targeted stub of it.

const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const cache = createClient({ url: process.env.REDIS_URL });
cache.on('error', err => console.error('Redis client error:', err.message));

const ITEMS_CACHE_KEY = 'items:all';
const CACHE_TTL_SECONDS = 60;

async function init() {
  await cache.connect();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Database and cache ready');
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    await cache.ping();
    res.json({ status: 'ok', db: 'ok', cache: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

app.get('/items', async (_req, res) => {
  try {
    const cached = await cache.get(ITEMS_CACHE_KEY);
    if (cached) return res.json(JSON.parse(cached));

    const { rows } = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
    await cache.setEx(ITEMS_CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(rows));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/items', async (req, res) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required and must be a string' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO items (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    await cache.del(ITEMS_CACHE_KEY);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT ?? 3000;

init()
  .then(() => app.listen(PORT, () => console.log(`API listening on port ${PORT}`)))
  .catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
