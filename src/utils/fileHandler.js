/**
 * File Handler Utility
 *
 * Helper functions for file operations
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    logger.error('Error creating directory', { dirPath, error: error.message });
    throw error;
  }
}

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @param {string} prefix - Prefix (optional)
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName, prefix = '') {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');

  return `${prefix}${timestamp}-${random}${ext}`;
}

/**
 * Calculate file hash
 * @param {Buffer|string} input - File buffer or path
 * @returns {Promise<string>} SHA-256 hash
 */
async function calculateFileHash(input) {
  try {
    let buffer;

    if (Buffer.isBuffer(input)) {
      buffer = input;
    } else {
      buffer = await fs.readFile(input);
    }

    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (error) {
    logger.error('Error calculating file hash', { error: error.message });
    throw error;
  }
}

/**
 * Get file size in bytes
 * @param {string} filePath - File path
 * @returns {Promise<number>} File size
 */
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    logger.error('Error getting file size', { filePath, error: error.message });
    return 0;
  }
}

/**
 * Delete file safely
 * @param {string} filePath - File path
 * @returns {Promise<boolean>} Success status
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error('Error deleting file', { filePath, error: error.message });
    }
    return false;
  }
}

/**
 * Move file
 * @param {string} sourcePath - Source path
 * @param {string} destPath - Destination path
 * @returns {Promise<boolean>} Success status
 */
async function moveFile(sourcePath, destPath) {
  try {
    await ensureDir(path.dirname(destPath));
    await fs.rename(sourcePath, destPath);
    return true;
  } catch (error) {
    logger.error('Error moving file', {
      sourcePath,
      destPath,
      error: error.message,
    });
    return false;
  }
}

/**
 * Copy file
 * @param {string} sourcePath - Source path
 * @param {string} destPath - Destination path
 * @returns {Promise<boolean>} Success status
 */
async function copyFile(sourcePath, destPath) {
  try {
    await ensureDir(path.dirname(destPath));
    await fs.copyFile(sourcePath, destPath);
    return true;
  } catch (error) {
    logger.error('Error copying file', {
      sourcePath,
      destPath,
      error: error.message,
    });
    return false;
  }
}

/**
 * Read file as buffer
 * @param {string} filePath - File path
 * @returns {Promise<Buffer>} File buffer
 */
async function readFile(filePath) {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    logger.error('Error reading file', { filePath, error: error.message });
    throw error;
  }
}

/**
 * Write buffer to file
 * @param {string} filePath - File path
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<boolean>} Success status
 */
async function writeFile(filePath, buffer) {
  try {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, buffer);
    return true;
  } catch (error) {
    logger.error('Error writing file', { filePath, error: error.message });
    return false;
  }
}

/**
 * List files in directory
 * @param {string} dirPath - Directory path
 * @param {Object} options - Options (extension filter, etc)
 * @returns {Promise<Array<string>>} File paths
 */
async function listFiles(dirPath, options = {}) {
  try {
    const files = await fs.readdir(dirPath);

    let filtered = files.map((file) => path.join(dirPath, file));

    // Filter by extension
    if (options.extension) {
      filtered = filtered.filter(
        (file) => path.extname(file).toLowerCase() === options.extension.toLowerCase()
      );
    }

    // Filter by pattern
    if (options.pattern) {
      const regex = new RegExp(options.pattern);
      filtered = filtered.filter((file) => regex.test(path.basename(file)));
    }

    return filtered;
  } catch (error) {
    logger.error('Error listing files', { dirPath, error: error.message });
    return [];
  }
}

/**
 * Clean old files
 * @param {string} dirPath - Directory path
 * @param {number} daysOld - Delete files older than X days
 * @returns {Promise<number>} Number of files deleted
 */
async function cleanOldFiles(dirPath, daysOld = 30) {
  try {
    const files = await fs.readdir(dirPath);
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await deleteFile(filePath);
        deletedCount++;
      }
    }

    logger.info('Old files cleaned', { dirPath, deletedCount });

    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning old files', { dirPath, error: error.message });
    return 0;
  }
}

/**
 * Get directory size
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Total size in bytes
 */
async function getDirectorySize(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  } catch (error) {
    logger.error('Error getting directory size', { dirPath, error: error.message });
    return 0;
  }
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (Math.round((bytes / Math.pow(k, i)) * 100) / 100).toString() + ' ' + sizes[i];
}

/**
 * Check if file exists
 * @param {string} filePath - File path
 * @returns {Promise<boolean>} True if exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file extension
 * @param {string} filePath - File path or name
 * @returns {string} Extension without dot (e.g., 'jpg')
 */
function getFileExtension(filePath) {
  const ext = path.extname(filePath);
  return ext ? ext.slice(1).toLowerCase() : '';
}

/**
 * Get MIME type from extension
 * @param {string} extension - File extension
 * @returns {string} MIME type
 */
function getMimeType(extension) {
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
    txt: 'text/plain',
    json: 'application/json',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

module.exports = {
  ensureDir,
  generateUniqueFilename,
  calculateFileHash,
  getFileSize,
  deleteFile,
  moveFile,
  copyFile,
  readFile,
  writeFile,
  listFiles,
  cleanOldFiles,
  getDirectorySize,
  formatFileSize,
  fileExists,
  getFileExtension,
  getMimeType,
};
