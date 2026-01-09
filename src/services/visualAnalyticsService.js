/**
 * Visual Analytics Service
 *
 * Analytics calculations for comparisons, trends, and insights
 */

const reportDataRepository = require('../database/repositories/reportDataRepository');
const dateRangeHelper = require('../utils/dateRangeHelper');
const { formatCurrency, formatPercentage } = require('../utils/formatter');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Compare two periods
   */
  async comparePeriods(preset1, preset2) {
    try {
      const presets = dateRangeHelper.getPresetRanges();

      const range1 = presets[preset1];
      const range2 = presets[preset2];

      if (!range1 || !range2) {
        throw new Error('Invalid preset name');
      }

      const summary1 = await reportDataRepository.getReportSummary({
        startDate: range1.startDate,
        endDate: range1.endDate,
      });

      const summary2 = await reportDataRepository.getReportSummary({
        startDate: range2.startDate,
        endDate: range2.endDate,
      });

      return {
        period1: { label: range1.label, ...summary1 },
        period2: { label: range2.label, ...summary2 },
        comparison: {
          income: this._compareMetric(summary1.total_income, summary2.total_income),
          expense: this._compareMetric(summary1.total_expense, summary2.total_expense),
          net: this._compareMetric(summary1.net, summary2.net),
          transactions: this._compareMetric(
            summary1.total_transactions,
            summary2.total_transactions
          ),
        },
      };
    } catch (error) {
      logger.error('Error comparing periods', { error: error.message });
      throw error;
    }
  },

  /**
   * Get top performers (by category, user, or type)
   */
  async getTopPerformers(filters, groupBy = 'category', limit = 5) {
    try {
      const data = await reportDataRepository.getGroupedData(filters, groupBy);

      const sorted = [...data].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

      return sorted.slice(0, limit).map((item, index) => ({
        rank: index + 1,
        name: item.category_name || item.user_name || item.type || 'Unknown',
        count: parseInt(item.count),
        total: parseFloat(item.total),
        formatted: formatCurrency(item.total),
      }));
    } catch (error) {
      logger.error('Error getting top performers', { error: error.message });
      throw error;
    }
  },

  /**
   * Analyze trend direction
   */
  async analyzeTrend(filters, interval = 'day') {
    try {
      const trendData = await reportDataRepository.getTrendData(filters, interval);

      if (trendData.length < 2) {
        return { trend: 'insufficient_data', message: 'Data tidak cukup untuk analisis' };
      }

      const netValues = trendData.map(
        (d) => parseFloat(d.income || 0) - parseFloat(d.expense || 0)
      );

      // Calculate trend using linear regression
      const n = netValues.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = netValues.reduce((a, b) => a + b, 0);
      const sumXY = netValues.reduce((sum, y, x) => sum + x * y, 0);
      const sumXX = Array.from({ length: n }, (_, i) => i * i).reduce((a, b) => a + b, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

      // Calculate average and volatility
      const avg = sumY / n;
      const variance = netValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      // Determine trend direction
      let trend, emoji, description;

      if (slope > avg * 0.1) {
        trend = 'strongly_up';
        emoji = '🚀';
        description = 'Trend sangat positif';
      } else if (slope > 0) {
        trend = 'up';
        emoji = '📈';
        description = 'Trend positif';
      } else if (slope < -avg * 0.1) {
        trend = 'strongly_down';
        emoji = '📉';
        description = 'Trend sangat negatif';
      } else if (slope < 0) {
        trend = 'down';
        emoji = '↘️';
        description = 'Trend negatif';
      } else {
        trend = 'stable';
        emoji = '➡️';
        description = 'Trend stabil';
      }

      return {
        trend,
        emoji,
        description,
        stats: {
          average: avg,
          averageFormatted: formatCurrency(avg),
          volatility: stdDev,
          min: Math.min(...netValues),
          max: Math.max(...netValues),
          periods: n,
        },
      };
    } catch (error) {
      logger.error('Error analyzing trend', { error: error.message });
      throw error;
    }
  },

  /**
   * Get financial health score
   */
  async getFinancialHealth(filters) {
    try {
      const summary = await reportDataRepository.getReportSummary(filters);

      let score = 50;
      const factors = [];

      // Positive cashflow
      if (summary.net > 0) {
        score += 20;
        factors.push({ name: 'Cashflow Positif', impact: '+20', status: 'good' });
      } else {
        score -= 20;
        factors.push({ name: 'Cashflow Negatif', impact: '-20', status: 'bad' });
      }

      // Income/Expense ratio
      if (summary.total_expense > 0) {
        const ratio = summary.total_income / summary.total_expense;
        if (ratio > 1.5) {
          score += 20;
          factors.push({ name: 'Rasio I/E Sangat Baik', impact: '+20', status: 'good' });
        } else if (ratio > 1.2) {
          score += 10;
          factors.push({ name: 'Rasio I/E Baik', impact: '+10', status: 'good' });
        } else if (ratio < 1) {
          score -= 20;
          factors.push({ name: 'Pengeluaran > Pemasukan', impact: '-20', status: 'bad' });
        }
      }

      // Transaction volume
      if (summary.total_transactions > 50) {
        score += 10;
        factors.push({ name: 'Volume Transaksi Tinggi', impact: '+10', status: 'good' });
      }

      score = Math.max(0, Math.min(100, score));

      let status, emoji;
      if (score >= 80) {
        status = 'Excellent';
        emoji = '💚';
      } else if (score >= 60) {
        status = 'Good';
        emoji = '💛';
      } else if (score >= 40) {
        status = 'Fair';
        emoji = '🧡';
      } else {
        status = 'Needs Attention';
        emoji = '❤️';
      }

      return {
        score,
        status,
        emoji,
        factors,
        summary: {
          income: formatCurrency(summary.total_income),
          expense: formatCurrency(summary.total_expense),
          net: formatCurrency(summary.net),
        },
      };
    } catch (error) {
      logger.error('Error calculating financial health', { error: error.message });
      throw error;
    }
  },

  /**
   * Compare metric helper
   */
  _compareMetric(value1, value2) {
    const diff = value2 - value1;
    const percentage = value1 !== 0 ? (diff / value1) * 100 : 0;

    return {
      value1,
      value2,
      diff,
      percentage,
      trend: diff >= 0 ? 'up' : 'down',
      formatted: {
        value1: formatCurrency(value1),
        value2: formatCurrency(value2),
        diff: formatCurrency(Math.abs(diff)),
        percentage: formatPercentage(Math.abs(percentage)),
      },
    };
  },
};
