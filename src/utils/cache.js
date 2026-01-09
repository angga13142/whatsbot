/**
 * Cache Utility
 *
 * In-memory caching with TTL support
 */

const NodeCache = require('node-cache');
const logger = require('./logger');

class Cache {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // Default 5 minutes
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false,
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Get value from cache
   */
  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      logger.debug('Cache hit', { key });
      return value;
    }
    this.stats.misses++;
    logger.debug('Cache miss', { key });
    return null;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = null) {
    this.stats.sets++;
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Get or set (fetch if not exists)
   */
  async getOrSet(key, fetchFn, ttl = null) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Delete key
   */
  del(key) {
    this.stats.deletes++;
    return this.cache.del(key);
  }

  /**
   * Delete keys by pattern
   */
  delPattern(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter((key) => key.includes(pattern));
    matchingKeys.forEach((key) => this.del(key));
    return matchingKeys.length;
  }

  /**
   * Clear all cache
   */
  flush() {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  /**
   * Build cache key
   */
  buildKey(...parts) {
    return parts.join('_');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
        : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      keys: this.cache.keys().length,
    };
  }
}

module.exports = new Cache();
