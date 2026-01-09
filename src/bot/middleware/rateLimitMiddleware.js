// File: src/bot/middleware/rateLimitMiddleware.js

/**
 * Rate Limit Middleware
 *
 * Purpose: Prevent spamming.
 */

const limits = new Map();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 20;

module.exports = {
  checkRateLimit(phoneNumber) {
    const now = Date.now();
    const userHistory = limits.get(phoneNumber) || [];

    // Filter requests within window
    const recent = userHistory.filter((timestamp) => now - timestamp < WINDOW_MS);

    if (recent.length >= MAX_REQUESTS) {
      return false; // Rate limited
    }

    recent.push(now);
    limits.set(phoneNumber, recent);
    return true;
  },
};
