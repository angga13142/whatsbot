const logger = require('./logger');
const geoip = require('geoip-lite');

class SecurityAudit {
  /**
   * Log security event
   */
  async logSecurityEvent(eventType, userId, details = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      severity: this._determineSeverity(eventType),
      ...details,
    };

    // Log to file
    logger.security(event); // Assuming logger has .security method, if not will fallback to info
    if (!logger.security) logger.info('SECURITY:', event);

    // Store in database for compliance
    await this._storeAuditLog(event);

    // Alert if critical
    if (event.severity === 'critical') {
      await this._sendSecurityAlert(event);
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(userId, success, ipAddress, userAgent) {
    const geo = geoip.lookup(ipAddress);

    await this.logSecurityEvent('auth_attempt', userId, {
      success,
      ipAddress,
      userAgent,
      location: geo ? `${geo.city}, ${geo.country}` : 'Unknown',
      timestamp: new Date(),
    });

    // Check for brute force
    if (!success) {
      await this._checkBruteForce(userId, ipAddress);
    }
  }

  /**
   * Log data access
   */
  async logDataAccess(userId, resource, action, recordId) {
    await this.logSecurityEvent('data_access', userId, {
      resource,
      action,
      recordId,
    });
  }

  /**
   * Log permission change
   */
  async logPermissionChange(adminId, targetUserId, oldRole, newRole) {
    await this.logSecurityEvent('permission_change', adminId, {
      severity: 'high',
      targetUserId,
      oldRole,
      newRole,
    });
  }

  /**
   * Determine event severity
   * @private
   */
  _determineSeverity(eventType) {
    const severityMap = {
      auth_attempt: 'low',
      auth_failure: 'medium',
      permission_change: 'high',
      data_deletion: 'high',
      bulk_export: 'medium',
      suspicious_activity: 'critical',
    };

    return severityMap[eventType] || 'low';
  }

  /**
   * Store audit log in database
   * @private
   */
  async _storeAuditLog(event) {
    try {
      const knex = require('../database/connection');

      await knex('security_audit_logs').insert({
        event_type: event.eventType,
        user_id: event.userId,
        severity: event.severity,
        details: JSON.stringify(event),
        created_at: new Date(),
      });
    } catch (error) {
      console.error('Failed to write security audit log:', error.message);
    }
  }

  /**
   * Check for brute force attacks
   * @private
   */
  async _checkBruteForce(userId, ipAddress) {
    try {
      const knex = require('../database/connection');
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const failedAttempts = await knex('security_audit_logs')
        .where({
          event_type: 'auth_attempt',
          user_id: userId,
        })
        .where('created_at', '>', fiveMinutesAgo)
        //.whereRaw("JSON_EXTRACT(details, '$.success') = false") // SQLite JSON specific, varying syntax
        .andWhere('details', 'like', '%"success":false%') // Simpler text match check for SQLite
        .count('* as count')
        .first();

      if (failedAttempts && failedAttempts.count >= 5) {
        await this.logSecurityEvent('suspicious_activity', userId, {
          severity: 'critical',
          reason: 'Possible brute force attack',
          failedAttempts: failedAttempts.count,
          ipAddress,
        });
      }
    } catch (error) {
      console.error('Error checking brute force:', error);
    }
  }

  /**
   * Send security alert
   * @private
   */
  async _sendSecurityAlert(event) {
    // Send alert to administrators
    if (logger.error) logger.error('SECURITY ALERT', event);
    else console.error('SECURITY ALERT', event);

    // Implementation depends on your alert system (e.g. EmailService)
  }
}

const securityAudit = new SecurityAudit();

module.exports = securityAudit;
