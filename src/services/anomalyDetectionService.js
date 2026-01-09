/**
 * Anomaly Detection Service
 *
 * Detect unusual patterns and anomalies in transaction data
 */

const reportDataRepository = require('../database/repositories/reportDataRepository');
const statistics = require('simple-statistics');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

class AnomalyDetectionService {
  constructor() {
    this.zScoreThreshold = 2.5; // Standard deviations
    this.percentileThreshold = 95; // Top 5% considered anomaly
  }

  /**
   * Detect anomalies in recent transactions
   * @param {Object} filters - Data filters
   * @param {Object} options - Detection options
   * @returns {Promise<Array>} Detected anomalies
   */
  async detectAnomalies(filters = {}, options = { threshold: 2.5 }) {
    // eslint-disable-line no-unused-vars
    try {
      // Get transaction data
      const transactions = await reportDataRepository.executeReport(filters, {
        sortBy: 'transaction_date',
        sortOrder: 'desc',
        limit: 1000,
      });

      if (transactions.length < 30) {
        return {
          anomalies: [],
          message: 'Insufficient data for anomaly detection (minimum 30 transactions)',
        };
      }

      const anomalies = [];

      // Method 1: Z-Score based detection
      const amountAnomalies = this._detectAmountAnomalies(transactions);
      anomalies.push(...amountAnomalies);

      // Method 2: Frequency anomalies
      const frequencyAnomalies = this._detectFrequencyAnomalies(transactions);
      anomalies.push(...frequencyAnomalies);

      // Method 3: Pattern deviation
      const patternAnomalies = this._detectPatternDeviations(transactions);
      anomalies.push(...patternAnomalies);

      // Deduplicate and sort by severity
      const uniqueAnomalies = this._deduplicateAnomalies(anomalies);
      const sortedAnomalies = uniqueAnomalies.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      logger.info('Anomalies detected', {
        totalAnomalies: sortedAnomalies.length,
        filters,
      });

      return {
        anomalies: sortedAnomalies,
        summary: this._generateAnomalySummary(sortedAnomalies),
        detectionDate: new Date(),
      };
    } catch (error) {
      logger.error('Error detecting anomalies', { error: error.message });
      throw error;
    }
  }

  /**
   * Check single transaction for anomalies
   * @param {Object} transaction - Transaction to check
   * @param {Object} context - Historical context
   * @returns {Promise<Object>} Anomaly result
   */
  async checkTransaction(transaction, context) {
    try {
      const amount = parseFloat(transaction.amount);
      const type = transaction.type;
      const category = transaction.category_id;

      // Get historical data for this type/category
      const historicalData = context.transactions || [];

      if (historicalData.length < 10) {
        return {
          isAnomaly: false,
          reason: 'Insufficient historical data',
        };
      }

      const amounts = historicalData
        .filter((t) => t.type === type && (!category || t.category_id === category))
        .map((t) => parseFloat(t.amount));

      if (amounts.length < 5) {
        return {
          isAnomaly: false,
          reason: 'Insufficient comparable transactions',
        };
      }

      // Calculate statistics
      const mean = statistics.mean(amounts);
      const stdDev = statistics.standardDeviation(amounts);
      const zScore = (amount - mean) / stdDev;

      const isAnomaly = Math.abs(zScore) > this.zScoreThreshold;

      if (isAnomaly) {
        return {
          isAnomaly: true,
          severity: this._calculateSeverity(zScore),
          zScore: zScore.toFixed(2),
          deviation: (((amount - mean) / mean) * 100).toFixed(1) + '%',
          message: this._generateAnomalyMessage(transaction, mean, zScore),
          recommendation: this._generateRecommendation(zScore, transaction),
        };
      }

      return {
        isAnomaly: false,
        zScore: zScore.toFixed(2),
      };
    } catch (error) {
      logger.error('Error checking transaction', { error: error.message });
      throw error;
    }
  }

  /**
   * Detect amount-based anomalies using Z-Score
   * @private
   */
  _detectAmountAnomalies(transactions) {
    const anomalies = [];

    // Group by type
    const byType = {};
    transactions.forEach((t) => {
      if (!byType[t.type]) byType[t.type] = [];
      byType[t.type].push(parseFloat(t.amount));
    });

    // Check each type
    Object.entries(byType).forEach(([type, amounts]) => {
      if (amounts.length < 10) return;

      const mean = statistics.mean(amounts);
      const stdDev = statistics.standardDeviation(amounts);

      transactions
        .filter((t) => t.type === type)
        .forEach((transaction) => {
          const amount = parseFloat(transaction.amount);
          const zScore = (amount - mean) / stdDev;

          if (Math.abs(zScore) > this.zScoreThreshold) {
            anomalies.push({
              transactionId: transaction.transaction_id,
              type: 'amount',
              severity: this._calculateSeverity(zScore),
              zScore: zScore.toFixed(2),
              transaction,
              description: `Unusual ${type} amount: ${this._formatCurrency(amount)} (${zScore.toFixed(1)}σ from mean)`,
              detectedAt: new Date(),
            });
          }
        });
    });

    return anomalies;
  }

  /**
   * Detect frequency anomalies
   * @private
   */
  _detectFrequencyAnomalies(transactions) {
    const anomalies = [];

    // Group by date
    const byDate = {};
    transactions.forEach((t) => {
      const date = dayjs(t.transaction_date).format('YYYY-MM-DD');
      if (!byDate[date]) byDate[date] = 0;
      byDate[date]++;
    });

    const frequencies = Object.values(byDate);
    if (frequencies.length < 7) return anomalies;

    const mean = statistics.mean(frequencies);
    const stdDev = statistics.standardDeviation(frequencies);

    // Check for days with unusual transaction counts
    Object.entries(byDate).forEach(([date, count]) => {
      const zScore = (count - mean) / stdDev;

      if (Math.abs(zScore) > this.zScoreThreshold) {
        anomalies.push({
          type: 'frequency',
          severity: this._calculateSeverity(zScore),
          date,
          count,
          description: `Unusual transaction frequency on ${date}: ${count} transactions (${zScore.toFixed(1)}σ from normal)`,
          detectedAt: new Date(),
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect pattern deviations
   * @private
   */
  _detectPatternDeviations(transactions) {
    const anomalies = [];

    // Check for unusual time patterns
    const hourCounts = Array(24).fill(0);
    transactions.forEach((t) => {
      const hour = dayjs(t.transaction_date).hour();
      hourCounts[hour]++;
    });

    const avgCount = statistics.mean(hourCounts.filter((c) => c > 0));

    hourCounts.forEach((count, hour) => {
      if (count > avgCount * 3 && count > 5) {
        anomalies.push({
          type: 'pattern',
          severity: 'medium',
          description: `Unusual activity at ${hour}:00 - ${count} transactions (${(count / avgCount).toFixed(1)}x normal)`,
          detectedAt: new Date(),
        });
      }
    });

    return anomalies;
  }

  /**
   * Calculate anomaly severity
   * @private
   */
  _calculateSeverity(zScore) {
    const absZ = Math.abs(zScore);

    if (absZ > 4) return 'critical';
    if (absZ > 3) return 'high';
    if (absZ > 2.5) return 'medium';
    return 'low';
  }

  /**
   * Generate anomaly message
   * @private
   */
  _generateAnomalyMessage(transaction, mean, zScore) {
    const amount = parseFloat(transaction.amount);
    const deviation = (((amount - mean) / mean) * 100).toFixed(1);
    const direction = amount > mean ? 'higher' : 'lower';

    return `Transaction amount is ${Math.abs(deviation)}% ${direction} than normal for this category.`;
  }

  /**
   * Generate recommendation
   * @private
   */
  _generateRecommendation(zScore, transaction) {
    const absZ = Math.abs(zScore);

    if (absZ > 4) {
      return 'URGENT: Review immediately. This transaction is extremely unusual and may require investigation.';
    } else if (absZ > 3) {
      return 'HIGH PRIORITY: Verify this transaction is correct and authorized.';
    } else {
      return 'REVIEW: Check if this transaction is expected given current business activities.';
    }
  }

  /**
   * Deduplicate anomalies
   * @private
   */
  _deduplicateAnomalies(anomalies) {
    const seen = new Set();
    return anomalies.filter((a) => {
      const key = a.transactionId || `${a.type}-${a.date || a.description}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate anomaly summary
   * @private
   */
  _generateAnomalySummary(anomalies) {
    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byType = {
      amount: 0,
      frequency: 0,
      pattern: 0,
    };

    anomalies.forEach((a) => {
      if (bySeverity[a.severity] !== undefined) {
        bySeverity[a.severity]++;
      }
      if (byType[a.type] !== undefined) {
        byType[a.type]++;
      }
    });

    return {
      total: anomalies.length,
      bySeverity,
      byType,
      requiresAttention: bySeverity.critical + bySeverity.high,
    };
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

module.exports = new AnomalyDetectionService();
