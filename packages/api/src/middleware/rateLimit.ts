// Rate limiting middleware using Cloudflare KV
import type { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyPrefix: string;  // Prefix for KV key
}

// Generate rate limit key from request
function getRateLimitKey(c: Context, prefix: string): string {
  const ip = c.req.header('CF-Connecting-IP') ||
             c.req.header('X-Forwarded-For') ||
             'unknown';
  return `${prefix}:${ip}`;
}

// Simple sliding window rate limiter
export function rateLimit(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const kv = c.env.SKILLPACK_KV;
    if (!kv) {
      console.warn('KV not available, skipping rate limit');
      await next();
      return;
    }

    const key = getRateLimitKey(c, config.keyPrefix);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Get current count from KV
      const stored = await kv.get(key, { type: 'json' }) as { count: number; resetAt: number } | null;

      if (!stored || stored.resetAt < now) {
        // New window
        await kv.put(key, JSON.stringify({
          count: 1,
          resetAt: now + config.windowMs,
        }), { expirationTtl: Math.ceil(config.windowMs / 1000) });
      } else {
        // Check limit
        if (stored.count >= config.maxRequests) {
          const retryAfter = Math.ceil((stored.resetAt - now) / 1000);
          return c.json({
            error: 'rate_limit_exceeded',
            message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            retryAfter,
          }, 429);
        }

        // Increment count
        await kv.put(key, JSON.stringify({
          count: stored.count + 1,
          resetAt: stored.resetAt,
        }), { expirationTtl: Math.ceil((stored.resetAt - now) / 1000) });
      }

      await next();
    } catch (e) {
      console.error('Rate limit error:', e);
      // Fail open - allow request if rate limiting fails
      await next();
    }
  };
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Create share links: 100/hour per IP
  createShare: rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 100,
    keyPrefix: 'ratelimit:share:create',
  }),

  // Resolve share links: 1000/hour per IP
  resolveShare: rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 1000,
    keyPrefix: 'ratelimit:share:resolve',
  }),

  // Password verification attempts: 5/hour per token
  verifyPassword: (token: string) => rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 5,
    keyPrefix: `ratelimit:password:${token}`,
  }),

  // Create packs: 20/hour per IP
  createPack: rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
    keyPrefix: 'ratelimit:pack:create',
  }),

  // Publish skills: 50/hour per IP
  publish: rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 50,
    keyPrefix: 'ratelimit:publish',
  }),
};
