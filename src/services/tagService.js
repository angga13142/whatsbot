/**
 * Tag Service
 *
 * Tag management, suggestions, and analytics
 */

const tagRepository = require('../database/repositories/tagRepository');
const auditRepository = require('../database/repositories/auditRepository');
const logger = require('../utils/logger');

/**
 * Generate slug from name
 * @param {string} name - Name to slugify
 * @returns {string}
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

class TagService {
  /**
   * Get all tags
   * @returns {Promise<Array>}
   */
  async getAllTags() {
    try {
      return await tagRepository.findAll();
    } catch (error) {
      logger.error('Error getting all tags', { error: error.message });
      throw error;
    }
  }

  /**
   * Get popular tags
   * @param {number} limit - Number of tags to return
   * @returns {Promise<Array>}
   */
  async getPopularTags(limit = 10) {
    try {
      return await tagRepository.findPopular(limit);
    } catch (error) {
      logger.error('Error getting popular tags', { error: error.message });
      throw error;
    }
  }

  /**
   * Get tag by ID
   * @param {number} id - Tag ID
   * @returns {Promise<Object>}
   */
  async getTagById(id) {
    try {
      const tag = await tagRepository.findById(id);

      if (!tag) {
        throw new Error('Tag tidak ditemukan');
      }

      return tag;
    } catch (error) {
      logger.error('Error getting tag', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Search tags by query
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async searchTags(query) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      return await tagRepository.search(query.trim());
    } catch (error) {
      logger.error('Error searching tags', { query, error: error.message });
      throw error;
    }
  }

  /**
   * Create new tag
   * @param {string} name - Tag name
   * @param {Object} options - Additional options
   * @returns {Promise<Object>}
   */
  async createTag(name, options = {}) {
    try {
      // Validate name
      if (!name || name.trim().length < 2) {
        throw new Error('Nama tag minimal 2 karakter');
      }

      if (name.length > 50) {
        throw new Error('Nama tag maksimal 50 karakter');
      }

      // Generate slug
      const slug = slugify(name);

      // Check if tag already exists
      const existing = await tagRepository.findBySlug(slug);
      if (existing) {
        // Return existing tag instead of creating duplicate
        logger.info('Tag already exists, returning existing', { slug });
        return existing;
      }

      // Create tag
      const tag = await tagRepository.create({
        name: name.trim(),
        slug,
        color: options.color || this._generateRandomColor(),
        description: options.description || null,
        usage_count: 0,
      });

      logger.info('Tag created', { tagId: tag.id, name: tag.name });

      return tag;
    } catch (error) {
      logger.error('Error creating tag', { name, error: error.message });
      throw error;
    }
  }

  /**
   * Update tag
   * @param {number} id - Tag ID
   * @param {Object} updates - Data to update
   * @returns {Promise<Object>}
   */
  async updateTag(id, updates) {
    try {
      const tag = await tagRepository.findById(id);

      if (!tag) {
        throw new Error('Tag tidak ditemukan');
      }

      // If name is updated, regenerate slug
      if (updates.name) {
        updates.slug = slugify(updates.name);

        // Check slug uniqueness
        const existing = await tagRepository.findBySlug(updates.slug);
        if (existing && existing.id !== id) {
          throw new Error('Tag dengan nama ini sudah ada');
        }
      }

      const updated = await tagRepository.update(id, updates);

      logger.info('Tag updated', { tagId: id });

      return updated;
    } catch (error) {
      logger.error('Error updating tag', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Delete tag
   * @param {number} id - Tag ID
   * @returns {Promise<boolean>}
   */
  async deleteTag(id) {
    try {
      const tag = await tagRepository.findById(id);

      if (!tag) {
        throw new Error('Tag tidak ditemukan');
      }

      // Check if tag is in use
      if (tag.usage_count > 0) {
        throw new Error(`Tag ini digunakan di ${tag.usage_count} transaksi. Tidak dapat dihapus.`);
      }

      await tagRepository.delete(id);

      logger.info('Tag deleted', { tagId: id, name: tag.name });

      return true;
    } catch (error) {
      logger.error('Error deleting tag', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Attach tags to transaction
   * @param {number} transactionId - Transaction ID
   * @param {Array<string>} tagNames - Array of tag names
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  async attachTagsToTransaction(transactionId, tagNames, userId) {
    try {
      if (!Array.isArray(tagNames) || tagNames.length === 0) {
        return [];
      }

      // Remove duplicates and empty strings
      const uniqueNames = [...new Set(tagNames.filter((name) => name && name.trim()))];

      if (uniqueNames.length === 0) {
        return [];
      }

      // Limit to 10 tags per transaction
      if (uniqueNames.length > 10) {
        throw new Error('Maksimal 10 tag per transaksi');
      }

      const tagIds = [];

      // Create or get existing tags
      for (const name of uniqueNames) {
        const tag = await this.createTag(name);
        tagIds.push(tag.id);
      }

      // Sync tags (remove old, add new)
      await tagRepository.syncTransactionTags(transactionId, tagIds);

      // Log activity
      await auditRepository.log(userId, 'attach_tags', 'transaction', transactionId, {
        tags: uniqueNames,
      });

      logger.info('Tags attached to transaction', {
        transactionId,
        tagCount: tagIds.length,
      });

      return await tagRepository.getTransactionTags(transactionId);
    } catch (error) {
      logger.error('Error attaching tags', {
        transactionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get tags for transaction
   * @param {number} transactionId - Transaction ID
   * @returns {Promise<Array>}
   */
  async getTransactionTags(transactionId) {
    try {
      return await tagRepository.getTransactionTags(transactionId);
    } catch (error) {
      logger.error('Error getting transaction tags', {
        transactionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get tag suggestions based on transaction data
   * @param {Object} transactionData - Transaction data
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  async getTagSuggestions(transactionData, userId) {
    try {
      const suggestions = new Set();

      // Suggest based on transaction type
      const typeSuggestions = this._getSuggestionsFromType(transactionData.type);
      typeSuggestions.forEach((tag) => suggestions.add(tag));

      // Suggest based on description keywords
      if (transactionData.description) {
        const keywordSuggestions = this._getSuggestionsFromKeywords(transactionData.description);
        keywordSuggestions.forEach((tag) => suggestions.add(tag));
      }

      // Suggest based on amount range
      const amountSuggestions = this._getSuggestionsFromAmount(transactionData.amount);
      amountSuggestions.forEach((tag) => suggestions.add(tag));

      // Get user's frequently used tags
      const frequentTags = await this._getUserFrequentTags(userId, 5);
      frequentTags.forEach((tag) => suggestions.add(tag.name));

      // Get popular tags
      const popularTags = await this.getPopularTags(5);
      popularTags.forEach((tag) => suggestions.add(tag.name));

      // Convert to array and limit
      return Array.from(suggestions).slice(0, 8);
    } catch (error) {
      logger.error('Error getting tag suggestions', { error: error.message });
      return [];
    }
  }

  /**
   * Get tag analytics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>}
   */
  async getTagAnalytics(filters = {}) {
    try {
      const knex = require('../database/connection');

      // Total tags
      const totalResult = await knex('tags').count('* as count').first();
      const totalTags = parseInt(totalResult.count);

      // Most used tags
      const mostUsed = await tagRepository.findPopular(10);

      // Tag usage over time
      let usageQuery = knex('transaction_tags')
        .join('transactions', 'transaction_tags.transaction_id', 'transactions.id')
        .select(
          knex.raw('DATE(transactions.transaction_date) as date'),
          knex.raw('COUNT(*) as count')
        )
        .groupBy(knex.raw('DATE(transactions.transaction_date)'))
        .orderBy('date', 'desc')
        .limit(30);

      if (filters.userId) {
        usageQuery = usageQuery.where('transactions.user_id', filters.userId);
      }

      const usageOverTime = await usageQuery;

      return {
        total_tags: totalTags,
        most_used: mostUsed,
        usage_over_time: usageOverTime,
      };
    } catch (error) {
      logger.error('Error getting tag analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Merge tags (combine multiple tags into one)
   * @param {Array<number>} sourceTagIds - Source tag IDs to merge
   * @param {number} targetTagId - Target tag ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async mergeTags(sourceTagIds, targetTagId, userId) {
    try {
      if (!Array.isArray(sourceTagIds) || sourceTagIds.length === 0) {
        throw new Error('Source tags harus berupa array dan tidak boleh kosong');
      }

      if (sourceTagIds.includes(targetTagId)) {
        throw new Error('Target tag tidak boleh ada di source tags');
      }

      // Verify target tag exists
      const targetTag = await tagRepository.findById(targetTagId);
      if (!targetTag) {
        throw new Error('Target tag tidak ditemukan');
      }

      const knex = require('../database/connection');

      // Update all transaction_tags references
      await knex('transaction_tags')
        .whereIn('tag_id', sourceTagIds)
        .update({ tag_id: targetTagId });

      // Update usage count
      const totalUsage = await knex('tags')
        .whereIn('id', sourceTagIds)
        .sum('usage_count as total')
        .first();

      await knex('tags')
        .where({ id: targetTagId })
        .increment('usage_count', parseInt(totalUsage.total) || 0);

      // Delete source tags
      await knex('tags').whereIn('id', sourceTagIds).del();

      // Log activity
      await auditRepository.log(userId, 'merge_tags', 'tag', targetTagId, {
        sourceTagIds,
        targetTagId,
      });

      logger.info('Tags merged', {
        sourceTagIds,
        targetTagId,
        userId,
      });

      return await tagRepository.findById(targetTagId);
    } catch (error) {
      logger.error('Error merging tags', { error: error.message });
      throw error;
    }
  }

  /**
   * Get tag suggestions from transaction type
   * @param {string} type - Transaction type
   * @returns {Array<string>}
   * @private
   */
  _getSuggestionsFromType(type) {
    const suggestions = {
      paket: ['penjualan', 'pendapatan', 'paket', 'customer'],
      utang: ['piutang', 'kredit', 'pembayaran', 'cicilan'],
      jajan: ['pengeluaran', 'operasional', 'biaya', 'belanja'],
    };

    return suggestions[type] || [];
  }

  /**
   * Get tag suggestions from description keywords
   * @param {string} description - Transaction description
   * @returns {Array<string>}
   * @private
   */
  _getSuggestionsFromKeywords(description) {
    const keywords = {
      pulsa: ['pulsa', 'komunikasi'],
      bensin: ['bensin', 'transportasi', 'bbm'],
      makan: ['makan', 'konsumsi', 'makanan'],
      transport: ['transportasi', 'perjalanan'],
      kantor: ['kantor', 'operasional'],
      listrik: ['listrik', 'utilitas'],
      internet: ['internet', 'komunikasi'],
      maintenance: ['maintenance', 'pemeliharaan'],
      marketing: ['marketing', 'promosi'],
      sewa: ['sewa', 'rental'],
    };

    const suggestions = [];
    const lowerDesc = description.toLowerCase();

    for (const [keyword, tags] of Object.entries(keywords)) {
      if (lowerDesc.includes(keyword)) {
        suggestions.push(...tags);
      }
    }

    return [...new Set(suggestions)];
  }

  /**
   * Get tag suggestions from amount
   * @param {number} amount - Transaction amount
   * @returns {Array<string>}
   * @private
   */
  _getSuggestionsFromAmount(amount) {
    const suggestions = [];

    if (amount < 50000) {
      suggestions.push('kecil');
    } else if (amount < 500000) {
      suggestions.push('sedang');
    } else if (amount < 1000000) {
      suggestions.push('besar');
    } else {
      suggestions.push('sangat-besar');
    }

    return suggestions;
  }

  /**
   * Get user's frequently used tags
   * @param {number} userId - User ID
   * @param {number} limit - Limit
   * @returns {Promise<Array>}
   * @private
   */
  async _getUserFrequentTags(userId, limit = 5) {
    try {
      const knex = require('../database/connection');

      return await knex('tags')
        .join('transaction_tags', 'tags.id', 'transaction_tags.tag_id')
        .join('transactions', 'transaction_tags.transaction_id', 'transactions.id')
        .where('transactions.user_id', userId)
        .groupBy('tags.id', 'tags.name')
        .select('tags.name')
        .count('* as count')
        .orderBy('count', 'desc')
        .limit(limit);
    } catch (error) {
      logger.error('Error getting user frequent tags', { userId, error: error.message });
      return [];
    }
  }

  /**
   * Generate random color for tag
   * @returns {string}
   * @private
   */
  _generateRandomColor() {
    const colors = [
      '#3B82F6',
      '#EF4444',
      '#10B981',
      '#F59E0B',
      '#8B5CF6',
      '#EC4899',
      '#14B8A6',
      '#F97316',
      '#6366F1',
      '#06B6D4',
      '#84CC16',
      '#F43F5E',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Clean unused tags (usage_count = 0)
   * @returns {Promise<number>}
   */
  async cleanUnusedTags() {
    try {
      const knex = require('../database/connection');

      const deleted = await knex('tags').where({ usage_count: 0 }).del();

      logger.info('Unused tags cleaned', { count: deleted });

      return deleted;
    } catch (error) {
      logger.error('Error cleaning unused tags', { error: error.message });
      throw error;
    }
  }
}

module.exports = new TagService();
