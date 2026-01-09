/**
 * Category Service
 *
 * Business logic for category management, budgets, and analytics
 */

const categoryRepository = require('../database/repositories/categoryRepository');
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

class CategoryService {
  /**
   * Get all active categories
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>}
   */
  async getAllCategories(filters = {}) {
    try {
      return await categoryRepository.findAllActive(filters);
    } catch (error) {
      logger.error('Error getting categories', { error: error.message });
      throw error;
    }
  }

  /**
   * Get category tree (hierarchical structure)
   * @returns {Promise<Array>}
   */
  async getCategoryTree() {
    try {
      return await categoryRepository.getCategoryTree();
    } catch (error) {
      logger.error('Error getting category tree', { error: error.message });
      throw error;
    }
  }

  /**
   * Get category by ID with usage stats
   * @param {number} id - Category ID
   * @returns {Promise<Object>}
   */
  async getCategoryById(id) {
    try {
      const category = await categoryRepository.findById(id);

      if (!category) {
        throw new Error('Kategori tidak ditemukan');
      }

      // Get usage stats
      const stats = await categoryRepository.getUsageStats(id);

      return {
        ...category,
        stats,
      };
    } catch (error) {
      logger.error('Error getting category', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Create new category
   * @param {Object} data - Category data
   * @param {number} createdBy - User ID
   * @returns {Promise<Object>}
   */
  async createCategory(data, createdBy) {
    try {
      // Validate required fields
      if (!data.name) {
        throw new Error('Nama kategori wajib diisi');
      }

      // Generate slug from name if not provided
      const slug = data.slug || slugify(data.name);

      // Check if slug already exists
      const existing = await categoryRepository.findBySlug(slug);
      if (existing) {
        throw new Error('Kategori dengan nama ini sudah ada');
      }

      // Validate parent category if provided
      if (data.parent_id) {
        const parent = await categoryRepository.findById(data.parent_id);
        if (!parent) {
          throw new Error('Kategori parent tidak ditemukan');
        }

        // Prevent circular reference
        if (parent.parent_id) {
          throw new Error('Kategori parent tidak boleh memiliki parent (max 2 level)');
        }
      }

      // Create category
      const category = await categoryRepository.create({
        name: data.name,
        slug,
        description: data.description || null,
        parent_id: data.parent_id || null,
        icon: data.icon || null,
        color: data.color || this._generateRandomColor(),
        type: data.type || 'both',
        is_system: false,
        is_active: true,
        sort_order: data.sort_order || 0,
        metadata: data.metadata || {},
      });

      // Log activity
      await auditRepository.log(createdBy, 'create_category', 'category', category.id, {
        name: category.name,
        slug: category.slug,
      });

      logger.info('Category created', {
        categoryId: category.id,
        name: category.name,
        createdBy,
      });

      return category;
    } catch (error) {
      logger.error('Error creating category', {
        data,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update category
   * @param {number} id - Category ID
   * @param {Object} updates - Data to update
   * @param {number} updatedBy - User ID
   * @returns {Promise<Object>}
   */
  async updateCategory(id, updates, updatedBy) {
    try {
      const category = await categoryRepository.findById(id);

      if (!category) {
        throw new Error('Kategori tidak ditemukan');
      }

      // Prevent updating system categories (except for sort_order)
      if (category.is_system && Object.keys(updates).some((key) => key !== 'sort_order')) {
        throw new Error('Kategori sistem tidak dapat diubah');
      }

      // If slug is being updated, check uniqueness
      if (updates.slug && updates.slug !== category.slug) {
        const existing = await categoryRepository.findBySlug(updates.slug);
        if (existing) {
          throw new Error('Slug sudah digunakan');
        }
      }

      // If name is updated but slug is not provided, auto-generate slug
      if (updates.name && !updates.slug) {
        updates.slug = slugify(updates.name);
      }

      // Update category
      const updated = await categoryRepository.update(id, updates);

      // Log activity
      await auditRepository.log(updatedBy, 'update_category', 'category', id, { updates });

      logger.info('Category updated', { categoryId: id, updatedBy });

      return updated;
    } catch (error) {
      logger.error('Error updating category', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete category (soft delete)
   * @param {number} id - Category ID
   * @param {number} deletedBy - User ID
   * @returns {Promise<boolean>}
   */
  async deleteCategory(id, deletedBy) {
    try {
      const category = await categoryRepository.findById(id);

      if (!category) {
        throw new Error('Kategori tidak ditemukan');
      }

      // Prevent deleting system categories
      if (category.is_system) {
        throw new Error('Kategori sistem tidak dapat dihapus');
      }

      // Check if category has children
      const children = await categoryRepository.findAllActive({ parent_id: id });
      if (children.length > 0) {
        throw new Error('Kategori memiliki sub-kategori. Hapus sub-kategori terlebih dahulu.');
      }

      // Check usage
      const stats = await categoryRepository.getUsageStats(id);
      if (stats.transaction_count > 0) {
        throw new Error(
          `Kategori ini digunakan di ${stats.transaction_count} transaksi. Tidak dapat dihapus.`
        );
      }

      // Delete category
      await categoryRepository.delete(id);

      // Log activity
      await auditRepository.log(deletedBy, 'delete_category', 'category', id, {
        name: category.name,
      });

      logger.info('Category deleted', { categoryId: id, deletedBy });

      return true;
    } catch (error) {
      logger.error('Error deleting category', {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Set budget for category
   * @param {number} categoryId - Category ID
   * @param {Object} budgetData - Budget data
   * @param {number} setBy - User ID
   * @returns {Promise<Object>}
   */
  async setBudget(categoryId, budgetData, setBy) {
    try {
      const category = await categoryRepository.findById(categoryId);

      if (!category) {
        throw new Error('Kategori tidak ditemukan');
      }

      // Validate budget data
      if (!budgetData.amount || budgetData.amount <= 0) {
        throw new Error('Jumlah budget harus lebih dari 0');
      }

      if (!budgetData.period) {
        throw new Error('Period budget wajib diisi');
      }

      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(budgetData.period)) {
        throw new Error('Period tidak valid');
      }

      if (!budgetData.start_date) {
        throw new Error('Tanggal mulai wajib diisi');
      }

      // Set budget using repository
      const budget = await categoryRepository.setBudget(categoryId, budgetData);

      // Log activity
      await auditRepository.log(setBy, 'set_category_budget', 'category', categoryId, {
        amount: budgetData.amount,
        period: budgetData.period,
      });

      logger.info('Budget set', { categoryId, amount: budgetData.amount });

      return budget;
    } catch (error) {
      logger.error('Error setting budget', {
        categoryId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check budget status for category
   * @param {number} categoryId - Category ID
   * @param {string} period - Period (monthly, weekly, etc)
   * @returns {Promise<Object>}
   */
  async checkBudgetStatus(categoryId, period = 'monthly') {
    try {
      const budget = await categoryRepository.getBudget(categoryId, period);

      if (!budget) {
        return {
          has_budget: false,
          message: 'Tidak ada budget untuk kategori ini',
        };
      }

      // Calculate spending in current period
      const knex = require('../database/connection');
      const dayjs = require('dayjs');

      let startDate, endDate;
      const now = dayjs();

      switch (period) {
        case 'daily':
          startDate = now.startOf('day');
          endDate = now.endOf('day');
          break;
        case 'weekly':
          startDate = now.startOf('week');
          endDate = now.endOf('week');
          break;
        case 'monthly':
          startDate = now.startOf('month');
          endDate = now.endOf('month');
          break;
        case 'yearly':
          startDate = now.startOf('year');
          endDate = now.endOf('year');
          break;
        default:
          startDate = now.startOf('month');
          endDate = now.endOf('month');
      }

      const result = await knex('transactions')
        .where({ category_id: categoryId, status: 'approved' })
        .whereBetween('transaction_date', [startDate.toDate(), endDate.toDate()])
        .sum('amount as total')
        .first();

      const spent = parseFloat(result.total) || 0;
      const budgetAmount = parseFloat(budget.amount);
      const percentage = (spent / budgetAmount) * 100;
      const remaining = budgetAmount - spent;

      let status = 'safe';
      let message = 'Budget masih aman';

      if (percentage >= 100) {
        status = 'exceeded';
        message = `Budget terlampaui ${this._formatCurrency(Math.abs(remaining))}`;
      } else if (percentage >= 90) {
        status = 'critical';
        message = `Mendekati limit! Sisa ${this._formatCurrency(remaining)}`;
      } else if (percentage >= 75) {
        status = 'warning';
        message = `Peringatan! Sisa ${this._formatCurrency(remaining)}`;
      }

      return {
        has_budget: true,
        budget_amount: budgetAmount,
        spent,
        remaining,
        percentage: Math.round(percentage),
        status,
        message,
        period,
      };
    } catch (error) {
      logger.error('Error checking budget status', {
        categoryId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Seed default categories
   * @returns {Promise<Array>}
   */
  async seedDefaultCategories() {
    try {
      await categoryRepository.seedDefaultCategories();
      logger.info('Default categories seeded');
      return await this.getAllCategories();
    } catch (error) {
      logger.error('Error seeding default categories', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate random color for category
   * @private
   */
  _generateRandomColor() {
    const colors = [
      '#EF4444',
      '#F59E0B',
      '#10B981',
      '#3B82F6',
      '#6366F1',
      '#8B5CF6',
      '#EC4899',
      '#14B8A6',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Format currency
   * @private
   */
  _formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}

module.exports = new CategoryService();
