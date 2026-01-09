/**
 * Environment Configuration
 *
 * Centralized environment variable management
 * Validates required variables on startup
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env when this module is imported.
// (Safe to call multiple times; app entrypoint also calls dotenv.config())
require('dotenv').config();

class EnvironmentConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    // Ensure NODE_ENV is always defined so validation and downstream code behave consistently
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = this.env;
    }
    this.validateEnvironment();
    this.secrets = this.loadSecrets();
  }

  /**
   * Validate required environment variables
   * @throws {Error} If required variables are missing
   */
  validateEnvironment() {
    const required = [];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
          'Please create a .env file with these variables.'
      );
    }

    // Warn about optional but recommended variables
    const recommended = [
      'DATABASE_PATH',
      'SESSION_SECRET',
      'ENCRYPTION_KEY',
      'EXCHANGE_RATE_API_KEY',
    ];

    const missingRecommended = recommended.filter((key) => !process.env[key]);

    if (missingRecommended.length > 0) {
      console.warn('⚠️  Missing recommended environment variables:');
      missingRecommended.forEach((key) => {
        console.warn(`   - ${key}`);
      });
    }

    // Validate SESSION_SECRET strength
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      console.warn('⚠️  SESSION_SECRET should be at least 32 characters for security');
    }

    // Validate NODE_ENV value
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(this.env)) {
      console.warn(`⚠️  NODE_ENV "${this.env}" is not standard. Use: ${validEnvs.join(', ')}`);
    }
  }

  /**
   * Load sensitive secrets
   * @returns {Object} Secrets object
   */
  loadSecrets() {
    return {
      sessionSecret: process.env.SESSION_SECRET || this.generateSecret('SESSION_SECRET', 64),
      encryptionKey: process.env.ENCRYPTION_KEY || this.generateSecret('ENCRYPTION_KEY', 32),
      exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY || null,
    };
  }

  /**
   * Generate a secret if not provided
   * @param {string} name - Secret name
   * @param {number} length - Length in bytes
   * @returns {string} Generated secret
   */
  generateSecret(name, length) {
    const secret = crypto.randomBytes(length).toString('hex');

    console.warn(`⚠️  ${name} not found. Generated a new secret.`);

    // Save to . env file if in development
    if (this.isDevelopment()) {
      this.saveToEnvFile(name, secret);
    }

    return secret;
  }

  /**
   * Save variable to .env file
   * @param {string} key - Environment variable key
   * @param {string} value - Environment variable value
   */
  saveToEnvFile(key, value) {
    try {
      const envPath = path.join(process.cwd(), '.env');
      const entry = `${key}=${value}\n`;

      // Create . env if doesn't exist
      if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, entry);
        console.log(`✅ Created .env file with ${key}`);
      } else {
        // Append if not already present
        const envContent = fs.readFileSync(envPath, 'utf8');
        if (!envContent.includes(`${key}=`)) {
          fs.appendFileSync(envPath, entry);
          console.log(`✅ Added ${key} to .env file`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to save ${key} to .env: `, error.message);
    }
  }

  /**
   * Get configuration value
   * @param {string} key - Config key
   * @param {any} defaultValue - Default value
   * @returns {any}
   */
  get(key, defaultValue = null) {
    return process.env[key] || defaultValue;
  }

  /**
   * Get integer value
   * @param {string} key - Config key
   * @param {number} defaultValue - Default value
   * @returns {number}
   */
  getInt(key, defaultValue = 0) {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  }

  /**
   * Get boolean value
   * @param {string} key - Config key
   * @param {boolean} defaultValue - Default value
   * @returns {boolean}
   */
  getBool(key, defaultValue = false) {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Check if production environment
   * @returns {boolean}
   */
  isProduction() {
    return this.env === 'production';
  }

  /**
   * Check if development environment
   * @returns {boolean}
   */
  isDevelopment() {
    return this.env === 'development';
  }

  /**
   * Check if test environment
   * @returns {boolean}
   */
  isTest() {
    return this.env === 'test';
  }

  /**
   * Get all configuration (excluding secrets)
   * @returns {Object}
   */
  getAll() {
    return {
      nodeEnv: this.env,
      databasePath: this.get('DATABASE_PATH', './storage/database.sqlite'),
      port: this.getInt('PORT', 3000),
      logLevel: this.get('LOG_LEVEL', 'info'),
      exportPath: this.get('EXPORT_PATH', './storage/exports'),
      chartPath: this.get('CHART_OUTPUT_PATH', './storage/charts'),
      pdfPath: this.get('PDF_OUTPUT_PATH', './storage/pdfs'),
      maxFileSize: this.getInt('MAX_FILE_SIZE', 10485760), // 10MB
      rateLimitEnabled: this.getBool('RATE_LIMIT_ENABLED', true),
      cacheTTL: this.getInt('CACHE_TTL', 300), // 5 minutes
      // Don't expose secrets!
    };
  }

  /**
   * Validate all paths exist
   */
  validatePaths() {
    const paths = [
      this.get('DATABASE_PATH', './storage/database.sqlite'),
      this.get('EXPORT_PATH', './storage/exports'),
      this.get('CHART_OUTPUT_PATH', './storage/charts'),
      this.get('PDF_OUTPUT_PATH', './storage/pdfs'),
    ];

    paths.forEach((filePath) => {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
}

// Create singleton
const envConfig = new EnvironmentConfig();

// Validate paths on startup
envConfig.validatePaths();

module.exports = envConfig;
