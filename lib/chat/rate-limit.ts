/**
 * Fixed-window rate limiter kept in server memory. Suitable for local use and
 * a single server only; deployments need a shared limit (e.g. a Vercel
 * Firewall rule) because each instance keeps its own counts.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { start: number; count: number }>();

  return function allow(key: string, now = Date.now()): boolean {
    const current = windows.get(key);
    if (!current || now - current.start >= windowMs) {
      windows.set(key, { start: now, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  };
}
