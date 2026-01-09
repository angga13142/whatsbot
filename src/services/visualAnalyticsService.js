/**
 * Visual Analytics Service
 *
 * Advanced analytics calculations and insights
 */

const reportDataRepository = require('../database/repositories/reportDataRepository');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

class VisualAnalyticsService {
  /**
   * Calculate growth rate
   * @param {Object} currentData - Current period data
   * @param {Object} previousData - Previous period data
   * @returns {Object} Growth metrics
   */
  calculateGrowth(currentData, previousData) {
    const incomeGrowth = this._calculateGrowthRate(
      currentData.total_income,
      previousData.total_income
    );

    const expenseGrowth = this._calculateGrowthRate(
      currentData.total_expense,
      previousData.total_expense
    );

    const netGrowth = this._calculateGrowthRate(currentData.net, previousData.net);

    return {
      income: incomeGrowth,
      expense: expenseGrowth,
      net: netGrowth,
      trend: this._determineTrend(incomeGrowth, expenseGrowth),
    };
  }

  /**
   * Get top performers
   * @param {Object} filters - Data filters
   * @param {string} dimension - Dimension (category, user)
   * @param {number} limit - Limit
   * @returns {Promise<Array>}
   */
  async getTopPerformers(filters, dimension = 'category', limit = 5) {
    try {
      const groupedData = await reportDataRepository.getGroupedData(filters, dimension);

      return groupedData
        .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
        .slice(0, limit)
        .map((item, index) => ({
          rank: index + 1,
          name: item.category_name || item.user_name || item.tag_name || 'Unknown',
          total: parseFloat(item.total),
          count: parseInt(item.count),
          average: parseFloat(item.total) / parseInt(item.count),
        }));
    } catch (error) {
      logger.error('Error getting top performers', { error: error.message });
      throw error;
    }
  }

  /**
   * Get bottom performers
   * @param {Object} filters - Data filters
   * @param {string} dimension - Dimension
   * @param {number} limit - Limit
   * @returns {Promise<Array>}
   */
  async getBottomPerformers(filters, dimension = 'category', limit = 5) {
    try {
      const groupedData = await reportDataRepository.getGroupedData(filters, dimension);

      return groupedData
        .sort((a, b) => parseFloat(a.total) - parseFloat(b.total))
        .slice(0, limit)
        .map((item, index) => ({
          rank: index + 1,
          name: item.category_name || item.user_name || 'Unknown',
          total: parseFloat(item.total),
          count: parseInt(item.count),
        }));
    } catch (error) {
      logger.error('Error getting bottom performers', { error: error.message });
      throw error;
    }
  }

  /**
   * Detect anomalies in data
   * @param {Array} trendData - Trend data
   * @returns {Array} Anomalies
   */
  detectAnomalies(trendData) {
    if (trendData.length < 7) {
      return [];
    }

    const values = trendData.map((d) => {
      const income = parseFloat(d.income || 0);
      const expense = parseFloat(d.expense || 0);
      return income - expense;
    });

    // Calculate mean and standard deviation
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect anomalies (values beyond 2 standard deviations)
    const anomalies = [];
    const threshold = 2;

    trendData.forEach((item, index) => {
      const value = values[index];
      const zScore = Math.abs((value - mean) / stdDev);

      if (zScore > threshold) {
        anomalies.push({
          period: item.period,
          value,
          zScore: zScore.toFixed(2),
          type: value > mean ? 'spike' : 'drop',
        });
      }
    });

    return anomalies;
  }

  /**
   * Calculate moving average
   * @param {Array} trendData - Trend data
   * @param {number} window - Window size
   * @returns {Array} Moving averages
   */
  calculateMovingAverage(trendData, window = 7) {
    const values = trendData.map((d) => {
      const income = parseFloat(d.income || 0);
      const expense = parseFloat(d.expense || 0);
      return income - expense;
    });

    const movingAverages = [];

    for (let i = 0; i < values.length; i++) {
      if (i < window - 1) {
        movingAverages.push(null);
      } else {
        const windowValues = values.slice(i - window + 1, i + 1);
        const average = windowValues.reduce((a, b) => a + b, 0) / window;
        movingAverages.push(average);
      }
    }

    return movingAverages;
  }

  /**
   * Forecast future values (simple linear regression)
   * @param {Array} trendData - Historical trend data
   * @param {number} periods - Number of periods to forecast
   * @returns {Array} Forecasted values
   */
  forecastTrend(trendData, periods = 7) {
    if (trendData.length < 3) {
      return [];
    }

    const values = trendData.map((d) => {
      const income = parseFloat(d.income || 0);
      const expense = parseFloat(d.expense || 0);
      return income - expense;
    });

    // Simple linear regression
    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecasts
    const forecasts = [];
    for (let i = 0; i < periods; i++) {
      const x = n + i;
      const forecast = slope * x + intercept;
      forecasts.push({
        period: `Forecast +${i + 1}`,
        value: Math.round(forecast),
        confidence: this._calculateConfidence(i, periods),
      });
    }

    return forecasts;
  }

  /**
   * Calculate KPIs
   * @param {Object} summary - Summary data
   * @param {Object} options - Options
   * @returns {Object} KPIs
   */
  calculateKPIs(summary, options = {}) {
    const profitMargin =
      summary.total_income > 0 ? ((summary.net / summary.total_income) * 100).toFixed(2) : 0;

    const expenseRatio =
      summary.total_income > 0
        ? ((summary.total_expense / summary.total_income) * 100).toFixed(2)
        : 0;

    const avgTransactionValue = summary.total_transactions > 0 ? summary.avg_amount : 0;

    const cashflowHealth = this._assessCashflowHealth(summary);

    return {
      profitMargin: parseFloat(profitMargin),
      expenseRatio: parseFloat(expenseRatio),
      avgTransactionValue,
      cashflowHealth,
      totalTransactions: summary.total_transactions,
      runRate: this._calculateRunRate(summary, options),
    };
  }

  /**
   * Calculate growth rate
   * @private
   */
  _calculateGrowthRate(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }

  /**
   * Determine trend
   * @private
   */
  _determineTrend(incomeGrowth, expenseGrowth) {
    if (incomeGrowth > expenseGrowth && incomeGrowth > 0) {
      return 'improving';
    } else if (incomeGrowth < expenseGrowth || incomeGrowth < 0) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  /**
   * Calculate forecast confidence
   * @private
   */
  // eslint-disable-next-line no-unused-vars
  // eslint-disable-next-line no-unused-vars
  _calculateConfidence(period, totalPeriods) {
    // eslint-disable-line no-unused-vars
    // Confidence decreases as we forecast further out
    const baseConfidence = 85;
    const decreaseRate = 10;
    return Math.max(baseConfidence - period * decreaseRate, 50);
  }

  /**
   * Assess cashflow health
   * @private
   */
  _assessCashflowHealth(summary) {
    let score = 50; // Base score

    // Positive net cashflow
    if (summary.net > 0) {
      score += 20;
    } else {
      score -= 20;
    }

    // Income to expense ratio
    if (summary.total_expense > 0) {
      const ratio = summary.total_income / summary.total_expense;
      if (ratio > 1.5) score += 20;
      else if (ratio > 1.2) score += 10;
      else if (ratio < 1) score -= 20;
    }

    // Transaction volume
    if (summary.total_transactions > 50) score += 10;

    score = Math.max(0, Math.min(100, score));

    let status;
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'fair';
    else status = 'poor';

    return { score, status };
  }

  /**
   * Calculate run rate
   * @private
   */
  _calculateRunRate(summary, options) {
    if (!options.startDate || !options.endDate) {
      return null;
    }

    const start = dayjs(options.startDate);
    const end = dayjs(options.endDate);
    const days = end.diff(start, 'day') + 1;

    if (days <= 0) return null;

    const dailyAverage = summary.net / days;

    return {
      daily: dailyAverage,
      weekly: dailyAverage * 7,
      monthly: dailyAverage * 30,
      yearly: dailyAverage * 365,
    };
  }
}

module.exports = new VisualAnalyticsService();
