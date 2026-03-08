import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { ApiBindings, ApiEnv, AuthenticatedUser, PublisherUser } from '../env.js';

type OAuthTokenRow = {
  user_id: string;
  expires_at: number;
};

function getBearerTokenFromHeader(header: string | undefined): string | null {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export function hashApiToken(token: string): string {
  return token.slice(0, 32);
}

async function getUserById(
  env: ApiBindings,
  userId: string
): Promise<AuthenticatedUser | null> {
  return env.DB.prepare(
    `SELECT id, username, email, created_at FROM users WHERE id = ?`
  ).bind(userId).first<AuthenticatedUser>();
}

async function getUserByApiKey(
  env: ApiBindings,
  token: string
): Promise<AuthenticatedUser | null> {
  const keyHash = hashApiToken(token);
  const cachedUserId = await env.SKILLPACK_KV.get(`key:${keyHash}`);
  if (cachedUserId) {
    return getUserById(env, cachedUserId);
  }

  return env.DB.prepare(
    `SELECT u.id, u.username, u.email, u.created_at
     FROM users u
     JOIN api_keys k ON u.id = k.user_id
     WHERE k.key_hash = ?`
  ).bind(keyHash).first<AuthenticatedUser>();
}

async function getUserByOAuthToken(
  env: ApiBindings,
  token: string
): Promise<AuthenticatedUser | null> {
  const cachedUserId = await env.SKILLPACK_KV.get(`token:${token}`);
  if (cachedUserId) {
    return getUserById(env, cachedUserId);
  }

  const oauthToken = await env.DB.prepare(
    `SELECT user_id, expires_at FROM oauth_tokens WHERE access_token = ? AND expires_at > unixepoch()`
  ).bind(token).first<OAuthTokenRow>();

  if (!oauthToken) {
    return null;
  }

  const user = await getUserById(env, oauthToken.user_id);
  if (user) {
    const ttl = Math.max(1, oauthToken.expires_at - Math.floor(Date.now() / 1000));
    await env.SKILLPACK_KV.put(`token:${token}`, user.id, { expirationTtl: ttl });
  }

  return user;
}

export async function resolveAuthenticatedUser(
  env: ApiBindings,
  token: string
): Promise<AuthenticatedUser | null> {
  return (await getUserByApiKey(env, token)) ?? getUserByOAuthToken(env, token);
}

export async function resolvePublisherFromToken(
  env: ApiBindings,
  token: string
): Promise<PublisherUser | null> {
  const user = await resolveAuthenticatedUser(env, token);
  return user ? { id: user.id, username: user.username } : null;
}

export function getBearerToken(c: Pick<Context<ApiEnv>, 'req'>): string | null {
  return getBearerTokenFromHeader(c.req.header('Authorization'));
}

export const authenticate = createMiddleware<ApiEnv>(async (c, next) => {
  const token = getBearerToken(c);
  if (!token) {
    return c.json(
      { error: 'unauthorized', message: 'Missing or invalid authorization' },
      401
    );
  }

  const user = await resolveAuthenticatedUser(c.env, token);
  if (!user) {
    return c.json({ error: 'unauthorized', message: 'Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
});
