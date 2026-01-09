/**
 * Tag Repository
 *
 * CRUD operations for tags and transaction-tag relationships
 */

const knex = require('../connection');

module.exports = {
  /**
   * Find tag by ID
   */
  async findById(id) {
    return await knex('tags').where({ id }).first();
  },

  /**
   * Find tag by slug
   */
  async findBySlug(slug) {
    return await knex('tags').where({ slug }).first();
  },

  /**
   * Find all tags
   */
  async findAll() {
    return await knex('tags').orderBy('usage_count', 'desc');
  },

  /**
   * Find popular tags
   */
  async findPopular(limit = 10) {
    return await knex('tags').orderBy('usage_count', 'desc').limit(limit);
  },

  /**
   * Create tag
   */
  async create(data) {
    const slug = data.slug || this.generateSlug(data.name);
    const [result] = await knex('tags')
      .insert({ ...data, slug })
      .returning('id');

    const id = typeof result === 'object' ? result.id : result;
    return await this.findById(id);
  },

  /**
   * Update tag
   */
  async update(id, data) {
    await knex('tags')
      .where({ id })
      .update({ ...data, updated_at: knex.fn.now() });
    return await this.findById(id);
  },

  /**
   * Delete tag
   */
  async delete(id) {
    return await knex('tags').where({ id }).del();
  },

  /**
   * Increment usage count
   */
  async incrementUsage(tagId) {
    await knex('tags').where({ id: tagId }).increment('usage_count', 1);
  },

  /**
   * Decrement usage count
   */
  async decrementUsage(tagId) {
    await knex('tags')
      .where({ id: tagId })
      .where('usage_count', '>', 0)
      .decrement('usage_count', 1);
  },

  /**
   * Attach tags to transaction
   */
  async attachToTransaction(transactionId, tagIds) {
    if (!tagIds || tagIds.length === 0) return;

    const inserts = tagIds.map((tagId) => ({
      transaction_id: transactionId,
      tag_id: tagId,
    }));

    // Use insert ignore for duplicates
    await knex('transaction_tags')
      .insert(inserts)
      .onConflict(['transaction_id', 'tag_id'])
      .ignore();

    // Increment usage count for all tags
    await knex('tags').whereIn('id', tagIds).increment('usage_count', 1);
  },

  /**
   * Detach tags from transaction
   */
  async detachFromTransaction(transactionId, tagIds = null) {
    let query = knex('transaction_tags').where('transaction_id', transactionId);

    if (tagIds) {
      query = query.whereIn('tag_id', tagIds);

      // Decrement usage count
      await knex('tags')
        .whereIn('id', tagIds)
        .where('usage_count', '>', 0)
        .decrement('usage_count', 1);
    } else {
      // Get all tags for this transaction first
      const currentTags = await this.getTransactionTags(transactionId);
      const currentTagIds = currentTags.map((t) => t.id);

      if (currentTagIds.length > 0) {
        await knex('tags')
          .whereIn('id', currentTagIds)
          .where('usage_count', '>', 0)
          .decrement('usage_count', 1);
      }
    }

    return await query.del();
  },

  /**
   * Sync tags for transaction (replace all)
   */
  async syncTransactionTags(transactionId, tagIds) {
    await this.detachFromTransaction(transactionId);
    if (tagIds && tagIds.length > 0) {
      await this.attachToTransaction(transactionId, tagIds);
    }
  },

  /**
   * Get tags for a transaction
   */
  async getTransactionTags(transactionId) {
    return await knex('tags')
      .join('transaction_tags', 'tags.id', 'transaction_tags.tag_id')
      .where('transaction_tags.transaction_id', transactionId)
      .select('tags.*');
  },

  /**
   * Get transactions by tag
   */
  async getTransactionsByTag(tagId, options = {}) {
    let query = knex('transactions')
      .join('transaction_tags', 'transactions.id', 'transaction_tags.transaction_id')
      .where('transaction_tags.tag_id', tagId)
      .select('transactions.*');

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    return await query.orderBy('transactions.created_at', 'desc');
  },

  /**
   * Search tags by name
   */
  async search(searchQuery) {
    return await knex('tags')
      .where('name', 'like', `%${searchQuery}%`)
      .orWhere('slug', 'like', `%${searchQuery}%`)
      .orderBy('usage_count', 'desc')
      .limit(20);
  },

  /**
   * Find or create tag by name
   */
  async findOrCreate(name) {
    const slug = this.generateSlug(name);
    let tag = await this.findBySlug(slug);

    if (!tag) {
      tag = await this.create({ name, slug });
    }

    return tag;
  },

  /**
   * Find or create multiple tags
   */
  async findOrCreateMany(names) {
    const tags = [];

    for (const name of names) {
      const tag = await this.findOrCreate(name.trim());
      if (tag) {
        tags.push(tag);
      }
    }

    return tags;
  },

  /**
   * Get tag statistics
   */
  async getStats(tagId) {
    const transactionStats = await knex('transactions')
      .join('transaction_tags', 'transactions.id', 'transaction_tags.transaction_id')
      .where('transaction_tags.tag_id', tagId)
      .count('* as count')
      .sum('transactions.amount as total')
      .first();

    return {
      transaction_count: parseInt(transactionStats.count) || 0,
      total_amount: parseFloat(transactionStats.total) || 0,
    };
  },

  /**
   * Generate slug from name
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  /**
   * Get related tags (tags often used together)
   */
  async getRelatedTags(tagId, limit = 5) {
    // Find transactions with this tag
    const transactionIds = await knex('transaction_tags')
      .where('tag_id', tagId)
      .select('transaction_id');

    if (transactionIds.length === 0) return [];

    // Find other tags used in those transactions
    const ids = transactionIds.map((t) => t.transaction_id);

    return await knex('tags')
      .join('transaction_tags', 'tags.id', 'transaction_tags.tag_id')
      .whereIn('transaction_tags.transaction_id', ids)
      .where('tags.id', '!=', tagId)
      .groupBy('tags.id')
      .select('tags.*')
      .count('* as co_occurrence')
      .orderBy('co_occurrence', 'desc')
      .limit(limit);
  },
};
