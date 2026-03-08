// User API routes
import { Hono } from 'hono';
import type { ApiEnv } from '../env.js';
import { authenticate } from '../utils/auth.js';

export const userRouter = new Hono<ApiEnv>();

type UserUpdateBody = {
  email?: string;
  username?: string;
};

type UserSkillRow = {
  name: string;
  namespace: string;
  description: string | null;
  version: string;
  privacy: string;
  created_at: number;
  updated_at: number;
};

// Get current user
userRouter.get('/', authenticate, async (c) => {
  const user = c.get('user');

  return c.json({
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.created_at,
  });
});

// Update user profile
userRouter.patch('/', authenticate, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<UserUpdateBody>().catch(() => ({} as UserUpdateBody));

  try {
    if (body.email) {
      await c.env.DB.prepare(
        `UPDATE users SET email = ? WHERE id = ?`
      ).bind(body.email, user.id).run();
    }

    if (body.username) {
      await c.env.DB.prepare(
        `UPDATE users SET username = ? WHERE id = ?`
      ).bind(body.username, user.id).run();
    }

    const stmt = await c.env.DB.prepare(
      `SELECT id, username, email, created_at FROM users WHERE id = ?`
    );
    const updated = await stmt.bind(user.id).first<typeof user>();

    if (!updated) {
      return c.json({ error: 'not_found', message: 'User not found' }, 404);
    }

    return c.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      createdAt: updated.created_at,
    });
  } catch (e) {
    return c.json({ error: 'update_failed', message: (e as Error).message }, 500);
  }
});

// Get user's skills
userRouter.get('/skills', authenticate, async (c) => {
  const user = c.get('user');

  try {
    const stmt = await c.env.DB.prepare(
      `SELECT name, namespace, description, latest_version as version, privacy, created_at, updated_at
       FROM skills
       WHERE namespace = ?
       ORDER BY updated_at DESC`
    );
    const skills = await stmt.bind(user.username).all<UserSkillRow>();

    return c.json({
      skills: (skills.results || []).map((skill) => ({
        ...skill,
        listed: skill.privacy === 'public',
      })),
    });
  } catch (e) {
    return c.json({ error: 'fetch_failed', message: (e as Error).message }, 500);
  }
});
