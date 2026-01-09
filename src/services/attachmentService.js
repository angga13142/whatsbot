/**
 * Attachment Service
 *
 * File upload, storage, and management
 */

const attachmentRepository = require('../database/repositories/attachmentRepository');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class AttachmentService {
  constructor() {
    this.storagePath = process.env.IMAGE_STORAGE_PATH || './storage/images';
    this.thumbnailPath = path.join(this.storagePath, 'thumbnails');
    this.maxFileSize = (process.env.MAX_IMAGE_SIZE_MB || 5) * 1024 * 1024;
    this.allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,pdf').split(',');

    this._ensureDirectories();
  }

  /**
   * Ensure storage directories exist
   * @private
   */
  async _ensureDirectories() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      await fs.mkdir(this.thumbnailPath, { recursive: true });
    } catch (error) {
      logger.error('Error creating storage directories', { error: error.message });
    }
  }

  /**
   * Download and save attachment from WhatsApp message
   * @param {Object} message - WhatsApp message object
   * @param {number} transactionId - Transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async saveFromMessage(message, transactionId, userId) {
    try {
      if (!message.hasMedia) {
        throw new Error('Pesan tidak memiliki media');
      }

      // Download media
      const media = await message.downloadMedia();

      if (!media) {
        throw new Error('Gagal mengunduh media');
      }

      // Validate file type
      const mimeType = media.mimetype;
      const extension = this._getExtensionFromMime(mimeType);

      if (!this._isAllowedType(extension)) {
        throw new Error(
          `Tipe file ${extension} tidak diizinkan. Hanya: ${this.allowedTypes.join(', ')}`
        );
      }

      // Validate file size
      const fileBuffer = Buffer.from(media.data, 'base64');
      if (fileBuffer.length > this.maxFileSize) {
        throw new Error(`Ukuran file terlalu besar. Maksimal ${this.maxFileSize / 1024 / 1024}MB`);
      }

      // Generate unique filename
      const filename = this._generateFilename(extension);
      const filePath = path.join(this.storagePath, filename);

      // Calculate file hash for deduplication
      const fileHash = this._calculateHash(fileBuffer);

      // Check if file already exists (deduplication)
      const existing = await attachmentRepository.findByHash(fileHash);
      if (existing && existing.transaction_id !== transactionId) {
        logger.info('File already exists (deduplication)', {
          existingId: existing.id,
          fileHash,
        });

        // Link existing file to new transaction
        return await attachmentRepository.create({
          transaction_id: transactionId,
          file_name: filename,
          file_type: mimeType,
          file_size: fileBuffer.length,
          storage_path: existing.storage_path,
          storage_type: 'local',
          thumbnail_path: existing.thumbnail_path,
          file_hash: fileHash,
          uploaded_by: userId,
        });
      }

      // Save file
      await fs.writeFile(filePath, fileBuffer);

      // Generate thumbnail if image
      let thumbnailFilePath = null;
      if (attachmentRepository.isImage(mimeType)) {
        thumbnailFilePath = await this._generateThumbnail(filePath, filename);
      }

      // Save to database
      const attachment = await attachmentRepository.create({
        transaction_id: transactionId,
        file_name: filename,
        file_type: mimeType,
        file_size: fileBuffer.length,
        storage_path: filePath,
        storage_type: 'local',
        thumbnail_path: thumbnailFilePath,
        file_hash: fileHash,
        metadata: null,
        uploaded_by: userId,
      });

      logger.info('Attachment saved', {
        attachmentId: attachment.id,
        transactionId,
        filename,
        size: fileBuffer.length,
      });

      return attachment;
    } catch (error) {
      logger.error('Error saving attachment', {
        transactionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Save file from buffer
   * @param {Buffer} buffer - File buffer
   * @param {string} mimeType - MIME type
   * @param {number} transactionId - Transaction ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async saveFromBuffer(buffer, mimeType, transactionId, userId) {
    try {
      const extension = this._getExtensionFromMime(mimeType);

      if (!this._isAllowedType(extension)) {
        throw new Error(
          `Tipe file ${extension} tidak diizinkan. Hanya: ${this.allowedTypes.join(', ')}`
        );
      }

      if (buffer.length > this.maxFileSize) {
        throw new Error(`Ukuran file terlalu besar. Maksimal ${this.maxFileSize / 1024 / 1024}MB`);
      }

      const filename = this._generateFilename(extension);
      const filePath = path.join(this.storagePath, filename);
      const fileHash = this._calculateHash(buffer);

      // Check for existing file
      const existing = await attachmentRepository.findByHash(fileHash);
      if (existing) {
        return await attachmentRepository.create({
          transaction_id: transactionId,
          file_name: filename,
          file_type: mimeType,
          file_size: buffer.length,
          storage_path: existing.storage_path,
          storage_type: 'local',
          thumbnail_path: existing.thumbnail_path,
          file_hash: fileHash,
          uploaded_by: userId,
        });
      }

      await fs.writeFile(filePath, buffer);

      let thumbnailFilePath = null;
      if (attachmentRepository.isImage(mimeType)) {
        thumbnailFilePath = await this._generateThumbnail(filePath, filename);
      }

      return await attachmentRepository.create({
        transaction_id: transactionId,
        file_name: filename,
        file_type: mimeType,
        file_size: buffer.length,
        storage_path: filePath,
        storage_type: 'local',
        thumbnail_path: thumbnailFilePath,
        file_hash: fileHash,
        uploaded_by: userId,
      });
    } catch (error) {
      logger.error('Error saving from buffer', { error: error.message });
      throw error;
    }
  }

  /**
   * Get attachments for transaction
   * @param {number} transactionId - Transaction ID
   * @returns {Promise<Array>}
   */
  async getTransactionAttachments(transactionId) {
    try {
      return await attachmentRepository.findByTransaction(transactionId);
    } catch (error) {
      logger.error('Error getting transaction attachments', {
        transactionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get attachment by ID
   * @param {number} id - Attachment ID
   * @returns {Promise<Object>}
   */
  async getAttachment(id) {
    try {
      return await attachmentRepository.findById(id);
    } catch (error) {
      logger.error('Error getting attachment', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Delete attachment
   * @param {number} id - Attachment ID
   * @param {number} deletedBy - User ID
   * @returns {Promise<boolean>}
   */
  async deleteAttachment(id, deletedBy) {
    try {
      const attachment = await attachmentRepository.findById(id);

      if (!attachment) {
        throw new Error('Attachment tidak ditemukan');
      }

      const deleted = await attachmentRepository.delete(id, true);

      if (deleted) {
        logger.info('Attachment deleted', { attachmentId: id, deletedBy });
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting attachment', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Get user storage usage
   * @param {number} userId - User ID
   * @returns {Promise<Object>}
   */
  async getUserStorageUsage(userId) {
    try {
      const totalBytes = await attachmentRepository.getTotalStorageByUser(userId);
      const stats = await attachmentRepository.getStatistics(userId);

      const maxStorage = this.maxFileSize * 100;
      const percentage = (totalBytes / maxStorage) * 100;

      return {
        used_bytes: totalBytes,
        used_mb: (totalBytes / 1024 / 1024).toFixed(2),
        max_bytes: maxStorage,
        max_mb: (maxStorage / 1024 / 1024).toFixed(2),
        percentage: Math.round(percentage),
        file_count: stats.total_attachments,
      };
    } catch (error) {
      logger.error('Error getting storage usage', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate thumbnail for image
   * @param {string} imagePath - Original image path
   * @param {string} filename - Filename
   * @returns {Promise<string>} Thumbnail path
   * @private
   */
  async _generateThumbnail(imagePath, filename) {
    try {
      // Try to use sharp if available
      const sharp = require('sharp');
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailFullPath = path.join(this.thumbnailPath, thumbnailFilename);

      await sharp(imagePath)
        .resize(200, 200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailFullPath);

      return thumbnailFullPath;
    } catch {
      // Sharp not available or error, skip thumbnail
      logger.debug('Thumbnail generation skipped (sharp not available)');
      return null;
    }
  }

  /**
   * Generate unique filename
   * @param {string} extension - File extension
   * @returns {string}
   * @private
   */
  _generateFilename(extension) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Calculate file hash (SHA-256)
   * @param {Buffer} buffer - File buffer
   * @returns {string}
   * @private
   */
  _calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get file extension from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string}
   * @private
   */
  _getExtensionFromMime(mimeType) {
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };
    return mimeMap[mimeType] || 'bin';
  }

  /**
   * Check if file type is allowed
   * @param {string} extension - File extension
   * @returns {boolean}
   * @private
   */
  _isAllowedType(extension) {
    return this.allowedTypes.includes(extension.toLowerCase());
  }

  /**
   * Cleanup orphaned attachments
   * @param {number} daysOld - Days old threshold
   * @returns {Promise<number>}
   */
  async cleanupOrphaned(daysOld = 30) {
    try {
      const deleted = await attachmentRepository.cleanupOrphaned(daysOld);

      logger.info('Orphaned attachments cleaned up', { count: deleted });

      return deleted;
    } catch (error) {
      logger.error('Error cleaning up orphaned attachments', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AttachmentService();
