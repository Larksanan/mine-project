import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  it('should allow requests within limit', async () => {
    const id = '127.0.0.1';
    const config = { interval: 60000, limit: 2 };

    const res1 = await rateLimiter.limit(id, config);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(1);

    const res2 = await rateLimiter.limit(id, config);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(0);
  });

  it('should block requests over limit', async () => {
    const id = '127.0.0.2';
    const config = { interval: 60000, limit: 1 };

    await rateLimiter.limit(id, config);
    const res = await rateLimiter.limit(id, config);

    expect(res.success).toBe(false);
    expect(res.remaining).toBe(0);
    expect(res.retryAfter).toBeGreaterThan(0);
  });

  it('should reset limit after interval', async () => {
    const id = '127.0.0.3';
    const config = { interval: 100, limit: 1 };

    await rateLimiter.limit(id, config);

    // Wait for interval to pass (using a small interval for testing)
    await new Promise(resolve => setTimeout(resolve, 150));

    const res = await rateLimiter.limit(id, config);
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(0);
  });
});
