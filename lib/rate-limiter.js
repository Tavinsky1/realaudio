// Simple in-memory rate limiter
// For production, consider using Redis or Vercel KV

const requestCounts = new Map();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > 3600000) { // 1 hour
      requestCounts.delete(key);
    }
  }
}, 3600000); // Run every hour

/**
 * Rate limit requests by IP address
 * @param {string} identifier - Usually the IP address
 * @param {Object} options - Rate limit configuration
 * @param {number} options.maxRequests - Maximum requests allowed
 * @param {number} options.windowMs - Time window in milliseconds
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(identifier, { maxRequests = 60, windowMs = 60000 } = {}) {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record) {
    // First request from this identifier
    const resetTime = now + windowMs;
    requestCounts.set(identifier, {
      count: 1,
      resetTime,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }

  // Check if window has expired
  if (now > record.resetTime) {
    // Reset the counter
    const resetTime = now + windowMs;
    requestCounts.set(identifier, {
      count: 1,
      resetTime,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }

  // Increment counter
  record.count++;

  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Get client identifier from request (IP address)
 * @param {Object} req - Next.js request object
 * @returns {string} - Client identifier
 */
export function getClientIdentifier(req) {
  // Try to get real IP from Vercel headers
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Try other common headers
  return (
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] || // Cloudflare
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Apply rate limit middleware to API route
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @param {Object} options - Rate limit options
 * @returns {boolean} - Whether the request is allowed
 */
export function applyRateLimit(req, res, options = {}) {
  const identifier = getClientIdentifier(req);
  const result = checkRateLimit(identifier, options);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', options.maxRequests || 60);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000));
  }

  return result.allowed;
}
