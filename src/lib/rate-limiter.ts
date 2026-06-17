import { LRUCache } from 'lru-cache';

export interface RateLimitConfig {
  interval: number;
  limit: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export class RateLimiter {
  private cache: LRUCache<string, { count: number; resetTime: number }>;

  constructor() {
    this.cache = new LRUCache<string, { count: number; resetTime: number }>({
      max: 1000,
      ttl: 1000 * 60 * 15,
    });
  }

  /**
   * Check if request is allowed based on rate limit
   */
  async limit(
    identifier: string,
    config: RateLimitConfig = { interval: 60000, limit: 10 }
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / config.interval)}`;

    const current = this.cache.get(key) || {
      count: 0,
      resetTime: now + config.interval,
    };

    if (current.resetTime < now) {
      // Reset counter if interval has passed
      current.count = 0;
      current.resetTime = now + config.interval;
    }

    const success = current.count < config.limit;
    const remaining = Math.max(0, config.limit - current.count - 1);

    if (success) {
      current.count++;
      this.cache.set(key, current, { ttl: config.interval });
    }

    return {
      success,
      limit: config.limit,
      remaining,
      reset: Math.ceil(current.resetTime / 1000),
      retryAfter: success
        ? undefined
        : Math.ceil((current.resetTime - now) / 1000),
    };
  }

  /**
   * Get rate limit headers for response
   */
  getHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toString(),
    };

    if (result.retryAfter !== undefined) {
      headers['Retry-After'] = result.retryAfter.toString();
    }

    return headers;
  }

  /**
   * Clear rate limit for an identifier
   */
  clear(identifier: string): void {
    const keys = Array.from(this.cache.keys()).filter(key =>
      key.startsWith(identifier)
    );

    keys.forEach(key => this.cache.delete(key));
  }

  /**
   * Get current rate limit status
   */
  async getStatus(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const interval = 60000; // 1 minute window
    const limit = 10; // Default limit
    const key = `${identifier}:${Math.floor(now / interval)}`;

    const current = this.cache.get(key) || {
      count: 0,
      resetTime: now + interval,
    };

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - current.count),
      reset: Math.ceil(current.resetTime / 1000),
    };
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

export { rateLimiter };

// Rate limit configurations for different endpoints
export const RateLimitConfigs = {
  // Strict limits for auth endpoints
  AUTH: {
    interval: 60000, // 1 minute
    limit: 5, // 5 requests per minute
  },

  // Moderate limits for checkout
  CHECKOUT: {
    interval: 60000, // 1 minute
    limit: 10, // 10 requests per minute
  },

  // Higher limits for general API
  API: {
    interval: 60000, // 1 minute
    limit: 60, // 60 requests per minute
  },

  // Very high limits for public endpoints
  PUBLIC: {
    interval: 60000, // 1 minute
    limit: 100, // 100 requests per minute
  },
};

// Higher-level API wrapper with different configurations
export async function rateLimit(
  identifier: string,
  config: keyof typeof RateLimitConfigs = 'API'
): Promise<RateLimitResult> {
  return rateLimiter.limit(identifier, RateLimitConfigs[config]);
}

// Helper function for Next.js API routes
export function createRateLimitMiddleware(
  config: keyof typeof RateLimitConfigs = 'API'
) {
  return async function (req: Request) {
    const identifier = getIdentifier(req);
    const result = await rateLimit(identifier, config);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Too many requests',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimiter.getHeaders(result),
          },
        }
      );
    }

    return null;
  };
}

// Helper to get identifier from request
function getIdentifier(req: Request): string {
  // Get IP address from headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'anonymous';

  return `ip:${ip}`;
}
