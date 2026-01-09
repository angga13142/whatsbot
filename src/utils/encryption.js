const crypto = require('crypto');
const envConfig = require('../config/env');

class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.saltLength = 64;
    this.tagLength = 16;
    this.tagPosition = this.saltLength + this.ivLength;
    this.encryptedPosition = this.tagPosition + this.tagLength;
  }

  /**
   * Get encryption key from environment
   */
  getKey() {
    const key = envConfig.secrets.encryptionKey;
    return crypto.scryptSync(key, 'salt', this.keyLength);
  }

  /**
   * Encrypt data
   */
  encrypt(text) {
    if (!text) return null;

    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);

    // Derive key using salt
    const key = crypto.scryptSync(envConfig.secrets.encryptionKey, salt, this.keyLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);

    const tag = cipher.getAuthTag();

    // Format: salt + iv + tag + encrypted_data
    return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
  }

  /**
   * Decrypt data
   */
  decrypt(data) {
    if (!data) return null;

    try {
      const stringValue = Buffer.from(String(data), 'hex');

      if (stringValue.length < this.encryptedPosition) return null;

      const salt = stringValue.slice(0, this.saltLength);
      const iv = stringValue.slice(this.saltLength, this.tagPosition);
      const tag = stringValue.slice(this.tagPosition, this.encryptedPosition);
      const encrypted = stringValue.slice(this.encryptedPosition);

      const key = crypto.scryptSync(envConfig.secrets.encryptionKey, salt, this.keyLength);
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

      decipher.setAuthTag(tag);

      return decipher.update(encrypted) + decipher.final('utf8');
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return null;
    }
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hashedPassword) {
    const [salt, originalHash] = hashedPassword.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  }
}

const encryption = new Encryption();

module.exports = encryption;
