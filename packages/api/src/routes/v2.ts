import { Hono } from 'hono';
import type { ApiEnv } from '../env.js';
import { getPublicProfile, resolveCatalogEntry, searchCatalog } from '../utils/catalog.js';

export const v2Router = new Hono<ApiEnv>();

v2Router.get('/catalog', async (c) => {
  const query = c.req.query('q') || '';
  const limit = Math.min(parseInt(c.req.query('limit') || '24', 10), 60);

  try {
    const entries = await searchCatalog(c.env, query, limit);
    return c.json({
      query,
      total: entries.length,
      entries,
    });
  } catch (error) {
    console.error('Catalog error:', error);
    return c.json({ error: 'catalog_failed', message: (error as Error).message }, 500);
  }
});

v2Router.post('/resolve-source', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  const input = typeof body.input === 'string' ? body.input : '';

  if (!input.trim()) {
    return c.json({ error: 'validation_error', message: 'input is required' }, 400);
  }

  try {
    const entry = await resolveCatalogEntry(c.env, input);
    if (!entry) {
      return c.json({ resolved: false, input });
    }

    return c.json({
      resolved: true,
      input,
      entry,
    });
  } catch (error) {
    console.error('Resolve source error:', error);
    return c.json({ error: 'resolve_failed', message: (error as Error).message }, 500);
  }
});

v2Router.get('/profiles/:username', async (c) => {
  const username = c.req.param('username');

  try {
    const profile = await getPublicProfile(c.env, username);
    if (!profile) {
      return c.json({ error: 'not_found', message: 'Profile not found' }, 404);
    }

    return c.json(profile);
  } catch (error) {
    console.error('Profile error:', error);
    return c.json({ error: 'profile_failed', message: (error as Error).message }, 500);
  }
});
