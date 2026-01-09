/**
 * Winston Logger Configuration
 *
 * Features:
 * - Console logging (colorized in development)
 * - File logging (daily rotation)
 * - Different log levels (error, warn, info, debug)
 * - Structured logging (JSON format in files)
 * - Timestamps in Asia/Jakarta timezone
 * - Separate error log file
 *
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('User logged in', { userId: 123 });
 *   logger.error('Database error', { error: err.message });
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Configure timezone
const timezoned = () => {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Jakarta',
  });
};

// Define log format for console
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: timezoned }),
    winston.format.json()
  ),
  transports: [
    // Console transport (for development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: timezoned }),
        consoleFormat
      ),
      handleExceptions: true,
    }),

    // Daily Rotate File (Combined)
    new DailyRotateFile({
      filename: path.join(process.env.LOG_PATH || './storage/logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      format: winston.format.combine(
        winston.format.timestamp({ format: timezoned }),
        winston.format.json()
      ),
    }),

    // Daily Rotate File (Error only)
    new DailyRotateFile({
      filename: path.join(process.env.LOG_PATH || './storage/logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: timezoned }),
        winston.format.json()
      ),
    }),
  ],
  exitOnError: false,
});

// Export logger instance
module.exports = logger;
