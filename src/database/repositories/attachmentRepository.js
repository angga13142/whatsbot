/**
 * Attachment Repository
 *
 * Manage file attachments for transactions
 */

const knex = require('../connection');
const path = require('path');
const fs = require('fs').promises;

module.exports = {
  /**
   * Find attachment by ID
   * @param {number} id - Attachment ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await knex('attachments').where({ id }).first();
  },

  /**
   * Find attachments by transaction
   * @param {number} transactionId - Transaction ID
   * @returns {Promise<Array>}
   */
  async findByTransaction(transactionId) {
    return await knex('attachments')
      .where({ transaction_id: transactionId })
      .orderBy('uploaded_at', 'asc');
  },

  /**
   * Find by file hash (for deduplication)
   * @param {string} fileHash - SHA-256 hash
   * @returns {Promise<Object|null>}
   */
  async findByHash(fileHash) {
    return await knex('attachments').where({ file_hash: fileHash }).first();
  },

  /**
   * Create attachment
   * @param {Object} data - Attachment data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const [result] = await knex('attachments')
      .insert({
        ...data,
        uploaded_at: knex.fn.now(),
      })
      .returning('id');

    const id = typeof result === 'object' ? result.id : result;
    return await this.findById(id);
  },

  /**
   * Update attachment
   * @param {number} id - Attachment ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    await knex('attachments').where({ id }).update(data);
    return await this.findById(id);
  },

  /**
   * Delete attachment
   * @param {number} id - Attachment ID
   * @param {boolean} deleteFile - Also delete physical file
   * @returns {Promise<boolean>}
   */
  async delete(id, deleteFile = true) {
    const attachment = await this.findById(id);

    if (!attachment) {
      return false;
    }

    // Delete from database
    await knex('attachments').where({ id }).del();

    // Delete physical file if requested and local storage
    if (deleteFile && attachment.storage_type === 'local') {
      try {
        await fs.unlink(attachment.storage_path);

        // Delete thumbnail if exists
        if (attachment.thumbnail_path) {
          await fs.unlink(attachment.thumbnail_path);
        }
      } catch {
        // Log but don't fail if file doesn't exist
        // File may have already been deleted
      }
    }

    return true;
  },

  /**
   * Delete all attachments for transaction
   * @param {number} transactionId - Transaction ID
   * @param {boolean} deleteFiles - Also delete physical files
   * @returns {Promise<number>} Number of attachments deleted
   */
  async deleteByTransaction(transactionId, deleteFiles = true) {
    const attachments = await this.findByTransaction(transactionId);

    let deletedCount = 0;
    for (const attachment of attachments) {
      const deleted = await this.delete(attachment.id, deleteFiles);
      if (deleted) deletedCount++;
    }

    return deletedCount;
  },

  /**
   * Get total storage used by user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Total bytes
   */
  async getTotalStorageByUser(userId) {
    const result = await knex('attachments')
      .where({ uploaded_by: userId })
      .sum('file_size as total')
      .first();

    return parseInt(result.total) || 0;
  },

  /**
   * Get attachment statistics
   * @param {number} userId - User ID (optional)
   * @returns {Promise<Object>}
   */
  async getStatistics(userId = null) {
    let query = knex('attachments');

    if (userId) {
      query = query.where({ uploaded_by: userId });
    }

    const result = await query.count('* as count').sum('file_size as total_size').first();

    // Get by file type
    let typeQuery = knex('attachments');
    if (userId) {
      typeQuery = typeQuery.where({ uploaded_by: userId });
    }

    const byType = await typeQuery
      .select('file_type')
      .count('* as count')
      .sum('file_size as size')
      .groupBy('file_type');

    return {
      total_attachments: parseInt(result.count) || 0,
      total_size: parseInt(result.total_size) || 0,
      by_type: byType,
    };
  },

  /**
   * Find orphaned attachments (no transaction)
   * @returns {Promise<Array>}
   */
  async findOrphaned() {
    return await knex('attachments')
      .leftJoin('transactions', 'attachments.transaction_id', 'transactions.id')
      .whereNull('transactions.id')
      .select('attachments.*');
  },

  /**
   * Clean up old orphaned attachments
   * @param {number} daysOld - Days old threshold
   * @returns {Promise<number>} Number deleted
   */
  async cleanupOrphaned(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const orphaned = await knex('attachments')
      .leftJoin('transactions', 'attachments.transaction_id', 'transactions.id')
      .whereNull('transactions.id')
      .where('attachments.uploaded_at', '<', cutoffDate)
      .select('attachments.*');

    let deletedCount = 0;
    for (const attachment of orphaned) {
      const deleted = await this.delete(attachment.id, true);
      if (deleted) deletedCount++;
    }

    return deletedCount;
  },

  /**
   * Get file extension from filename
   * @param {string} filename - Filename
   * @returns {string}
   */
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  },

  /**
   * Check if file type is image
   * @param {string} mimeType - MIME type
   * @returns {boolean}
   */
  isImage(mimeType) {
    return mimeType.startsWith('image/');
  },

  /**
   * Check if file type is document
   * @param {string} mimeType - MIME type
   * @returns {boolean}
   */
  isDocument(mimeType) {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    return documentTypes.includes(mimeType);
  },

  /**
   * Get allowed file types
   * @returns {Array<string>}
   */
  getAllowedTypes() {
    return [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
  },

  /**
   * Validate file type
   * @param {string} mimeType - MIME type
   * @returns {boolean}
   */
  isAllowedType(mimeType) {
    return this.getAllowedTypes().includes(mimeType);
  },

  /**
   * Get max file size (in bytes)
   * @returns {number}
   */
  getMaxFileSize() {
    return 10 * 1024 * 1024; // 10MB
  },

  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @returns {boolean}
   */
  isValidFileSize(size) {
    return size > 0 && size <= this.getMaxFileSize();
  },
};
