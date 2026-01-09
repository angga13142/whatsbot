/**
 * Category Repository
 *
 * CRUD operations for categories
 */

const knex = require('../connection');

module.exports = {
  /**
   * Find category by ID
   */
  async findById(id) {
    return await knex('categories').where({ id }).first();
  },

  /**
   * Find category by slug
   */
  async findBySlug(slug) {
    return await knex('categories').where({ slug }).first();
  },

  /**
   * Find all active categories
   */
  async findAllActive(filters = {}) {
    let query = knex('categories').where({ is_active: true }).orderBy('sort_order', 'asc');

    if (filters.type) {
      query = query.where('type', filters.type);
    }

    if (filters.parent_id !== undefined) {
      query = query.where('parent_id', filters.parent_id);
    }

    return await query;
  },

  /**
   * Get root categories (no parent)
   */
  async findRootCategories(type = null) {
    let query = knex('categories')
      .where({ is_active: true })
      .whereNull('parent_id')
      .orderBy('sort_order', 'asc');

    if (type) {
      query = query.where(function () {
        this.where('type', type).orWhere('type', 'both');
      });
    }

    return await query;
  },

  /**
   * Get subcategories
   */
  async findSubcategories(parentId) {
    return await knex('categories')
      .where({ parent_id: parentId, is_active: true })
      .orderBy('sort_order', 'asc');
  },

  /**
   * Get category tree (hierarchical)
   */
  async getCategoryTree() {
    const categories = await knex('categories')
      .where({ is_active: true })
      .orderBy('sort_order', 'asc');

    // Build tree structure
    const categoryMap = {};
    const tree = [];

    categories.forEach((cat) => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    categories.forEach((cat) => {
      if (cat.parent_id && categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
      } else if (!cat.parent_id) {
        tree.push(categoryMap[cat.id]);
      }
    });

    return tree;
  },

  /**
   * Create category
   */
  async create(data) {
    const slug = data.slug || this.generateSlug(data.name);
    const [result] = await knex('categories')
      .insert({ ...data, slug })
      .returning('id');

    const id = typeof result === 'object' ? result.id : result;
    return await this.findById(id);
  },

  /**
   * Update category
   */
  async update(id, data) {
    await knex('categories')
      .where({ id })
      .update({ ...data, updated_at: knex.fn.now() });
    return await this.findById(id);
  },

  /**
   * Delete category (soft delete)
   */
  async delete(id) {
    await knex('categories').where({ id }).update({ is_active: false, updated_at: knex.fn.now() });
    return true;
  },

  /**
   * Hard delete category
   */
  async hardDelete(id) {
    return await knex('categories').where({ id }).del();
  },

  /**
   * Get category usage stats
   */
  async getUsageStats(categoryId) {
    const result = await knex('transactions')
      .where({ category_id: categoryId })
      .count('* as count')
      .sum('amount as total')
      .first();

    return {
      transaction_count: parseInt(result.count) || 0,
      total_amount: parseFloat(result.total) || 0,
    };
  },

  /**
   * Get budget for category
   */
  async getBudget(categoryId, period = 'monthly') {
    return await knex('category_budgets')
      .where({
        category_id: categoryId,
        period,
        is_active: true,
      })
      .where('start_date', '<=', knex.fn.now())
      .where(function () {
        this.whereNull('end_date').orWhere('end_date', '>=', knex.fn.now());
      })
      .first();
  },

  /**
   * Create or update budget
   */
  async setBudget(categoryId, data) {
    const existing = await this.getBudget(categoryId, data.period);

    if (existing) {
      await knex('category_budgets')
        .where({ id: existing.id })
        .update({ ...data, updated_at: knex.fn.now() });
      return await knex('category_budgets').where({ id: existing.id }).first();
    }

    const [result] = await knex('category_budgets')
      .insert({
        category_id: categoryId,
        ...data,
      })
      .returning('id');

    const id = typeof result === 'object' ? result.id : result;
    return await knex('category_budgets').where({ id }).first();
  },

  /**
   * Get budget usage for a period
   */
  async getBudgetUsage(categoryId, startDate, endDate) {
    const result = await knex('transactions')
      .where({ category_id: categoryId })
      .whereBetween('transaction_date', [startDate, endDate])
      .sum('amount as total')
      .count('* as count')
      .first();

    return {
      spent: parseFloat(result.total) || 0,
      transaction_count: parseInt(result.count) || 0,
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
   * Seed default categories
   */
  async seedDefaultCategories() {
    const defaultCategories = [
      {
        name: 'Makanan & Minuman',
        slug: 'makanan-minuman',
        icon: '🍔',
        type: 'expense',
        is_system: true,
        sort_order: 1,
      },
      {
        name: 'Transportasi',
        slug: 'transportasi',
        icon: '🚗',
        type: 'expense',
        is_system: true,
        sort_order: 2,
      },
      {
        name: 'Belanja',
        slug: 'belanja',
        icon: '🛒',
        type: 'expense',
        is_system: true,
        sort_order: 3,
      },
      {
        name: 'Hiburan',
        slug: 'hiburan',
        icon: '🎬',
        type: 'expense',
        is_system: true,
        sort_order: 4,
      },
      {
        name: 'Tagihan',
        slug: 'tagihan',
        icon: '📝',
        type: 'expense',
        is_system: true,
        sort_order: 5,
      },
      {
        name: 'Kesehatan',
        slug: 'kesehatan',
        icon: '🏥',
        type: 'expense',
        is_system: true,
        sort_order: 6,
      },
      {
        name: 'Pendidikan',
        slug: 'pendidikan',
        icon: '📚',
        type: 'expense',
        is_system: true,
        sort_order: 7,
      },
      { name: 'Gaji', slug: 'gaji', icon: '💰', type: 'income', is_system: true, sort_order: 8 },
      { name: 'Bonus', slug: 'bonus', icon: '🎁', type: 'income', is_system: true, sort_order: 9 },
      {
        name: 'Investasi',
        slug: 'investasi',
        icon: '📈',
        type: 'income',
        is_system: true,
        sort_order: 10,
      },
      {
        name: 'Lainnya',
        slug: 'lainnya',
        icon: '📦',
        type: 'both',
        is_system: true,
        sort_order: 99,
      },
    ];

    for (const cat of defaultCategories) {
      const exists = await this.findBySlug(cat.slug);
      if (!exists) {
        await knex('categories').insert(cat);
      }
    }
  },
};
