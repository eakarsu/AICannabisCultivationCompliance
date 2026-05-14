// Rate limiter: 20 AI calls per hour per user
const rateLimitStore = new Map();

const AI_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getRateLimitKey(req) {
  // Use user ID from auth if available, otherwise fall back to IP
  return req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
}

function aiRateLimiter(req, res, next) {
  const key = getRateLimitKey(req);
  const now = Date.now();

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return next();
  }

  const entry = rateLimitStore.get(key);

  if (now - entry.windowStart > WINDOW_MS) {
    // Reset window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count >= AI_LIMIT) {
    const resetIn = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000);
    return res.status(429).json({
      error: 'Rate limit exceeded. Maximum 20 AI calls per hour.',
      retryAfterSeconds: resetIn,
    });
  }

  entry.count += 1;
  return next();
}

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export default aiRateLimiter;
