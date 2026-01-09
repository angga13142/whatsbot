/**
 * Insights Command
 *
 * Generate AI-powered business insights
 */

const businessIntelligenceService = require('../../services/businessIntelligenceService');
const visualAnalyticsService = require('../../services/visualAnalyticsService');
const anomalyDetectionService = require('../../services/anomalyDetectionService');
const insightGenerator = require('../../utils/insightGenerator');
const logger = require('../../utils/logger');
const { createBox, bold, createDivider } = require('../../utils/richText');
const { formatCurrency, formatPercentage } = require('../../utils/formatter');
const dayjs = require('dayjs');

module.exports = {
  name: 'insights',
  aliases: ['analisis'],
  description: 'Generate AI-powered insights',
  usage: '/insights [type]',

  async handler(client, message, user, args) {
    try {
      const type = args[0] ? args[0].toLowerCase() : 'quick';

      await message.reply('🔍 Analyzing data...');

      // Get filters (last 30 days)
      const filters = {
        startDate: dayjs().subtract(30, 'day').toDate(),
        endDate: dayjs().toDate(),
      };

      switch (type) {
        case 'quick':
          await this.generateQuickInsights(message, filters);
          break;

        case 'deep':
        case 'detailed':
          await this.generateDeepInsights(message, filters);
          break;

        case 'anomalies':
          await this.checkAnomalies(message, filters);
          break;

        case 'kpi':
        case 'metrics':
          await this.showKPIs(message, filters);
          break;

        default:
          await this.generateQuickInsights(message, filters);
      }
    } catch (error) {
      logger.error('Error in insights command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('❌ Failed to generate insights.');
    }
  },

  /**
   * Generate quick insights
   */
  async generateQuickInsights(message, filters) {
    try {
      const reportBuilderService = require('../../services/reportBuilderService');

      // Get report data
      const reportData = await reportBuilderService.executeReport(null, filters, 1);

      // Generate insights
      const insights = insightGenerator.generateInsights(reportData);

      if (insights.length === 0) {
        await message.reply('📊 No significant insights detected.  Everything looks normal! ');
        return;
      }

      let text = createBox('💡 QUICK INSIGHTS', 'Last 30 Days', 50) + '\n\n';

      // Show top 5 insights
      insights.slice(0, 5).forEach((insight, index) => {
        text += this._formatInsight(insight, index + 1);
        text += '\n';
      });

      text += createDivider('━', 50) + '\n';
      text += '💡 Use `/insights deep` for detailed analysis';

      await message.reply(text);
    } catch (error) {
      logger.error('Error generating quick insights', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate deep insights
   */
  async generateDeepInsights(message, filters) {
    try {
      // Get comprehensive business metrics
      const metrics = await businessIntelligenceService.calculateBusinessMetrics(filters);

      let text = createBox('🔍 DEEP ANALYSIS', 'Comprehensive Business Intelligence', 55) + '\n\n';

      // Profitability
      text += bold('💰 PROFITABILITY') + '\n';
      text += `Profit Margin: ${formatPercentage(metrics.profitability.profitMargin)}\n`;
      text += `Expense Ratio: ${formatPercentage(metrics.profitability.expenseRatio)}\n`;
      text += `ROI: ${formatPercentage(metrics.profitability.roi)}\n`;
      text += `Rating: ${this._ratingEmoji(metrics.profitability.rating)} ${metrics.profitability.rating}\n\n`;

      // Growth
      text += bold('📈 GROWTH') + '\n';
      text += `Revenue Growth: ${metrics.growth.revenueGrowth >= 0 ? '+' : ''}${formatPercentage(metrics.growth.revenueGrowth)}\n`;
      text += `Profit Growth: ${metrics.growth.profitGrowth >= 0 ? '+' : ''}${formatPercentage(metrics.growth.profitGrowth)}\n`;
      text += `Trend: ${this._trendEmoji(metrics.growth.trend)} ${metrics.growth.trend}\n\n`;

      // Customer Metrics
      if (metrics.customerMetrics.totalCustomers > 0) {
        text += bold('👥 CUSTOMERS') + '\n';
        text += `Total Customers: ${metrics.customerMetrics.totalCustomers}\n`;
        text += `Avg Revenue/Customer: ${formatCurrency(metrics.customerMetrics.avgRevenuePerCustomer)}\n\n`;
      }

      // Top Categories
      if (metrics.categoryPerformance.topPerforming.length > 0) {
        text += bold('🏆 TOP CATEGORIES') + '\n';
        metrics.categoryPerformance.topPerforming.forEach((cat, index) => {
          text += `${index + 1}. ${cat.name}:  ${formatCurrency(cat.total)}\n`;
        });
        text += '\n';
      }

      // Risks
      text += bold('⚠️ RISK ASSESSMENT') + '\n';
      text += `Overall Risk: ${this._riskEmoji(metrics.risks.overallRisk)} ${metrics.risks.overallRisk}\n`;
      text += `Risk Score: ${metrics.risks.riskScore}/100\n`;

      if (metrics.risks.risks.length > 0) {
        text += '\nIdentified Risks:\n';
        metrics.risks.risks.forEach((risk) => {
          text += `• ${risk.description} (${risk.severity})\n`;
        });
      }

      text += '\n' + createDivider('━', 55) + '\n';

      // Recommendations
      const recommendations = insightGenerator.generateRecommendations(metrics);
      if (recommendations.length > 0) {
        text += bold('💡 RECOMMENDATIONS') + '\n';
        recommendations.forEach((rec) => {
          text += `• ${rec}\n`;
        });
      }

      await message.reply(text);
    } catch (error) {
      logger.error('Error generating deep insights', { error: error.message });
      throw error;
    }
  },

  /**
   * Check anomalies
   */
  async checkAnomalies(message, filters) {
    try {
      const result = await anomalyDetectionService.detectAnomalies(filters);

      if (result.anomalies.length === 0) {
        await message.reply('✅ No anomalies detected.  All transactions appear normal!');
        return;
      }

      let text =
        createBox('⚠️ ANOMALY DETECTION', `Found ${result.anomalies.length} anomalies`, 50) +
        '\n\n';

      text += bold('📊 SUMMARY') + '\n';
      text += `Critical:  ${result.summary.bySeverity.critical}\n`;
      text += `High: ${result.summary.bySeverity.high}\n`;
      text += `Medium: ${result.summary.bySeverity.medium}\n`;
      text += `Low: ${result.summary.bySeverity.low}\n\n`;

      text += bold('🚨 TOP ANOMALIES') + '\n';

      // Show top 5 anomalies
      result.anomalies.slice(0, 5).forEach((anomaly, index) => {
        text += `${index + 1}. ${this._severityEmoji(anomaly.severity)} ${anomaly.description}\n`;
        if (anomaly.transactionId) {
          text += `   ID: ${anomaly.transactionId}\n`;
        }
        text += '\n';
      });

      text += createDivider('━', 50) + '\n';
      text += `⚠️ ${result.summary.requiresAttention} anomalies require immediate attention`;

      await message.reply(text);
    } catch (error) {
      logger.error('Error checking anomalies', { error: error.message });
      throw error;
    }
  },

  /**
   * Show KPIs
   */
  async showKPIs(message, filters) {
    try {
      const reportBuilderService = require('../../services/reportBuilderService');

      const reportData = await reportBuilderService.executeReport(null, filters, 1);
      const kpis = visualAnalyticsService.calculateKPIs(reportData.summary, {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      let text = createBox('📊 KEY PERFORMANCE INDICATORS', 'Last 30 Days', 50) + '\n\n';

      text += bold('💰 FINANCIAL METRICS') + '\n';
      text += `Profit Margin: ${formatPercentage(kpis.profitMargin)}\n`;
      text += `Expense Ratio: ${formatPercentage(kpis.expenseRatio)}\n`;
      text += `Avg Transaction:  ${formatCurrency(kpis.avgTransactionValue)}\n\n`;

      text += bold('💚 CASHFLOW HEALTH') + '\n';
      text += `Score: ${kpis.cashflowHealth.score}/100\n`;
      text += `Status: ${this._healthEmoji(kpis.cashflowHealth.status)} ${kpis.cashflowHealth.status}\n\n`;

      if (kpis.runRate) {
        text += bold('📈 RUN RATE') + '\n';
        text += `Daily:  ${formatCurrency(kpis.runRate.daily)}\n`;
        text += `Weekly: ${formatCurrency(kpis.runRate.weekly)}\n`;
        text += `Monthly: ${formatCurrency(kpis.runRate.monthly)}\n`;
        text += `Yearly: ${formatCurrency(kpis.runRate.yearly)}\n\n`;
      }

      text += createDivider('━', 50) + '\n';
      text += this._generateKPIInsight(kpis);

      await message.reply(text);
    } catch (error) {
      logger.error('Error showing KPIs', { error: error.message });
      throw error;
    }
  },

  /**
   * Format insight
   * @private
   */
  _formatInsight(insight, number) {
    const priorityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '💡',
      low: 'ℹ️',
    };

    let text = `${priorityEmoji[insight.priority]} ${bold(insight.title)}\n`;
    text += `${insight.message}\n`;

    if (insight.recommendation) {
      text += `💡 ${insight.recommendation}\n`;
    }

    return text;
  },

  /**
   * Helper emojis
   * @private
   */
  _ratingEmoji(rating) {
    const map = {
      excellent: '🌟',
      good: '👍',
      fair: '😐',
      poor: '👎',
      negative: '⚠️',
    };
    return map[rating] || '📊';
  },

  _trendEmoji(trend) {
    const map = {
      growing: '📈',
      declining: '📉',
      stable: '➡️',
      unknown: '❓',
    };
    return map[trend] || '📊';
  },

  _riskEmoji(risk) {
    const map = {
      low: '✅',
      medium: '⚠️',
      high: '🚨',
    };
    return map[risk] || '⚠️';
  },

  _severityEmoji(severity) {
    const map = {
      critical: '🚨',
      high: '⚠️',
      medium: '💡',
      low: 'ℹ️',
    };
    return map[severity] || '📊';
  },

  _healthEmoji(status) {
    const map = {
      excellent: '💚',
      good: '💛',
      fair: '🧡',
      poor: '❤️',
    };
    return map[status] || '📊';
  },

  /**
   * Generate KPI insight
   * @private
   */
  _generateKPIInsight(kpis) {
    let insight = bold('💡 ANALYSIS') + '\n\n';

    if (kpis.cashflowHealth.score >= 80) {
      insight += '✅ Excellent financial health!\n';
      insight += 'Your business is performing well.  Continue current strategies. ';
    } else if (kpis.cashflowHealth.score >= 60) {
      insight += '👍 Good financial health.\n';
      insight += 'Some areas for improvement. Focus on optimizing operations.';
    } else if (kpis.cashflowHealth.score >= 40) {
      insight += '⚠️ Fair financial health.\n';
      insight += 'Action needed.  Review expenses and revenue strategies.';
    } else {
      insight += '🚨 Poor financial health.\n';
      insight += 'Urgent attention required. Consider seeking professional advice.';
    }

    return insight;
  },
};
