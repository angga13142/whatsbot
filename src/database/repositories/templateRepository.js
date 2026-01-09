/**
 * Template Repository
 *
 * CRUD operations for transaction templates
 */

const knex = require('../connection');

module.exports = {
  /**
   * Find by ID
   */
  async findById(id) {
    return await knex('transaction_templates').where({ id }).first();
  },

  /**
   * Find by user (including shared)
   */
  async findByUser(userId, includeShared = true) {
    let query = knex('transaction_templates').where('created_by', userId);

    if (includeShared) {
      query = knex('transaction_templates').where(function () {
        this.where('created_by', userId)
          .orWhere('visibility', 'public')
          .orWhereRaw(`shared_with_users LIKE '%${userId}%'`);
      });
    }

    return await query.orderBy('usage_count', 'desc');
  },

  /**
   * Find favorites
   */
  async findFavorites(userId) {
    return await knex('transaction_templates')
      .where({ created_by: userId, is_favorite: true })
      .orderBy('sort_order', 'asc');
  },

  /**
   * Find public templates
   */
  async findPublic() {
    return await knex('transaction_templates')
      .where({ visibility: 'public' })
      .orderBy('usage_count', 'desc');
  },

  /**
   * Create template
   */
  async create(data) {
    const [result] = await knex('transaction_templates').insert(data).returning('id');

    const id = typeof result === 'object' ? result.id : result;
    return await this.findById(id);
  },

  /**
   * Update template
   */
  async update(id, data) {
    await knex('transaction_templates')
      .where({ id })
      .update({ ...data, updated_at: knex.fn.now() });
    return await this.findById(id);
  },

  /**
   * Delete template
   */
  async delete(id) {
    return await knex('transaction_templates').where({ id }).del();
  },

  /**
   * Toggle favorite
   */
  async toggleFavorite(id) {
    const template = await this.findById(id);
    if (!template) return null;

    return await this.update(id, { is_favorite: !template.is_favorite });
  },

  /**
   * Increment usage count
   */
  async incrementUsage(id) {
    await knex('transaction_templates')
      .where({ id })
      .increment('usage_count', 1)
      .update({ last_used_at: knex.fn.now() });

    return await this.findById(id);
  },

  /**
   * Share template with users
   */
  async shareWithUsers(id, userIds) {
    const template = await this.findById(id);
    if (!template) return null;

    const currentShared = template.shared_with_users ? JSON.parse(template.shared_with_users) : [];

    const newShared = [...new Set([...currentShared, ...userIds])];

    return await this.update(id, {
      visibility: 'shared',
      shared_with_users: JSON.stringify(newShared),
    });
  },

  /**
   * Unshare template from users
   */
  async unshareFromUsers(id, userIds) {
    const template = await this.findById(id);
    if (!template) return null;

    const currentShared = template.shared_with_users ? JSON.parse(template.shared_with_users) : [];

    const newShared = currentShared.filter((uid) => !userIds.includes(uid));

    return await this.update(id, {
      visibility: newShared.length > 0 ? 'shared' : 'private',
      shared_with_users: JSON.stringify(newShared),
    });
  },

  /**
   * Make template public
   */
  async makePublic(id) {
    return await this.update(id, { visibility: 'public' });
  },

  /**
   * Make template private
   */
  async makePrivate(id) {
    return await this.update(id, {
      visibility: 'private',
      shared_with_users: null,
    });
  },

  /**
   * Duplicate template
   */
  async duplicate(id, newOwnerId) {
    const template = await this.findById(id);
    if (!template) return null;

    const newTemplate = {
      name: `${template.name} (Copy)`,
      description: template.description,
      created_by: newOwnerId,
      type: template.type,
      category_id: template.category_id,
      default_amount: template.default_amount,
      default_currency: template.default_currency,
      default_description: template.default_description,
      default_tags: template.default_tags,
      visibility: 'private',
      shared_with_users: null,
      usage_count: 0,
      is_favorite: false,
      sort_order: 0,
      metadata: template.metadata,
    };

    return await this.create(newTemplate);
  },

  /**
   * Get template with category and creator info
   */
  async findByIdWithDetails(id) {
    return await knex('transaction_templates')
      .leftJoin('categories', 'transaction_templates.category_id', 'categories.id')
      .leftJoin('users', 'transaction_templates.created_by', 'users.id')
      .where('transaction_templates.id', id)
      .select(
        'transaction_templates.*',
        'categories.name as category_name',
        'categories.icon as category_icon',
        'users.name as creator_name'
      )
      .first();
  },

  /**
   * Search templates
   */
  async search(userId, query) {
    return await knex('transaction_templates')
      .where(function () {
        this.where('created_by', userId).orWhere('visibility', 'public');
      })
      .where(function () {
        this.where('name', 'like', `%${query}%`).orWhere('description', 'like', `%${query}%`);
      })
      .orderBy('usage_count', 'desc')
      .limit(20);
  },

  /**
   * Get most used templates
   */
  async getMostUsed(userId, limit = 5) {
    return await knex('transaction_templates')
      .where('created_by', userId)
      .orderBy('usage_count', 'desc')
      .limit(limit);
  },

  /**
   * Get recently used templates
   */
  async getRecentlyUsed(userId, limit = 5) {
    return await knex('transaction_templates')
      .where('created_by', userId)
      .whereNotNull('last_used_at')
      .orderBy('last_used_at', 'desc')
      .limit(limit);
  },

  /**
   * Update sort order
   */
  async updateSortOrder(templateOrders) {
    // templateOrders: [{ id: 1, sort_order: 0 }, { id: 2, sort_order: 1 }, ...]
    for (const item of templateOrders) {
      await knex('transaction_templates')
        .where({ id: item.id })
        .update({ sort_order: item.sort_order });
    }
  },
};
