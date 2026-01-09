/**
 * Forecast Command
 *
 * Generate forecasts and predictions
 */

const forecastingService = require('../../services/forecastingService');
const chartGeneratorService = require('../../services/chartGeneratorService');
const logger = require('../../utils/logger');
const rateLimiter = require('../../middleware/rateLimiter');
const { createBox, bold, createDivider } = require('../../utils/richText');
const { formatCurrency, formatDate, formatPercentage } = require('../../utils/formatter');
const dayjs = require('dayjs');

module.exports = {
  name: 'forecast',
  aliases: ['prediksi'],
  description: 'Generate forecasts and predictions',
  usage: '/forecast [type] [days]',

  async handler(client, message, user, args) {
    try {
      // Check rate limit
      const limitCheck = await rateLimiter.checkLimit(user.id, 'forecast');
      if (!limitCheck.allowed) {
        await message.reply(`⏰ ${limitCheck.message}`);
        return;
      }

      if (args.length === 0) {
        await this.showMenu(message);
        return;
      }

      const type = args[0].toLowerCase();
      const days = parseInt(args[1]) || 30;

      if (days > 90) {
        await message.reply('❌ Maximum forecast period is 90 days.');
        return;
      }

      await message.reply('🔮 Generating forecast...');

      // Get historical filters (last 60 days)
      const filters = {
        startDate: dayjs().subtract(60, 'day').toDate(),
        endDate: dayjs().toDate(),
      };

      switch (type) {
        case 'revenue':
        case 'income':
          await this.forecastRevenue(message, filters, days);
          break;

        case 'expense':
          await this.forecastExpense(message, filters, days);
          break;

        case 'cashflow':
        case 'net':
          await this.forecastCashflow(message, filters, days);
          break;

        default:
          await message.reply('❌ Invalid type. Use: revenue, expense, or cashflow');
      }
    } catch (error) {
      logger.error('Error in forecast command', {
        userId: user.id,
        error: error.message,
      });
      await message.reply('❌ Failed to generate forecast. ' + error.message);
    }
  },

  /**
   * Show forecast menu
   */
  async showMenu(message) {
    const menuText =
      createBox('🔮 FORECASTING', 'Predict future cashflow', 50) +
      '\n\n' +
      bold('📊 FORECAST TYPES') +
      '\n' +
      '`/forecast revenue [days]` - Revenue prediction\n' +
      '`/forecast expense [days]` - Expense prediction\n' +
      '`/forecast cashflow [days]` - Net cashflow projection\n\n' +
      bold('📅 PERIODS') +
      '\n' +
      '• 7 days (1 week)\n' +
      '• 30 days (1 month)\n' +
      '• 90 days (3 months)\n\n' +
      bold('📝 EXAMPLES') +
      '\n' +
      '`/forecast cashflow 30`\n' +
      '`/forecast revenue 7`\n' +
      '`/forecast expense 90`\n\n' +
      createDivider('━', 50) +
      '\n' +
      '💡 Forecasts based on historical data\n' +
      '📊 Includes confidence intervals';

    await message.reply(menuText);
  },

  /**
   * Forecast revenue
   */
  async forecastRevenue(message, filters, days) {
    try {
      const forecast = await forecastingService.forecastRevenue(filters, days);

      const avgForecast = forecast.forecast.reduce((a, b) => a + b, 0) / forecast.forecast.length;

      let text = createBox('📈 REVENUE FORECAST', `Next ${days} Days`, 50) + '\n\n';

      text += bold('🎯 PREDICTION') + '\n';
      text += `Forecasted Revenue: ${formatCurrency(avgForecast * days)}\n`;
      text += `Daily Average: ${formatCurrency(avgForecast)}\n`;
      text += `Trend: ${forecast.trend}\n\n`;

      text += bold('📊 CONFIDENCE') + '\n';
      const avgConfidence =
        forecast.confidence.reduce((sum, item) => sum + item.confidence, 0) /
        forecast.confidence.length;
      text += `Confidence Level: ${avgConfidence}%\n`;
      text += `Best Case: ${formatCurrency(forecast.confidence[0].upper)}\n`;
      text += `Worst Case: ${formatCurrency(forecast.confidence[0].lower)}\n\n`;

      text += bold('📈 ANALYSIS') + '\n';
      text += `Historical Average: ${formatCurrency(forecast.average)}\n`;
      const change = ((avgForecast - forecast.average) / forecast.average) * 100;
      text += `Expected Change: ${change >= 0 ? '+' : ''}${formatPercentage(change)}\n\n`;

      text += createDivider('━', 50) + '\n';
      text += this._generateForecastRecommendation(forecast.trend, change);

      await message.reply(text);
    } catch (error) {
      logger.error('Error forecasting revenue', { error: error.message });
      throw error;
    }
  },

  /**
   * Forecast expenses
   */
  async forecastExpense(message, filters, days) {
    try {
      const forecast = await forecastingService.forecastExpenses(filters, days);

      const avgForecast = forecast.forecast.reduce((a, b) => a + b, 0) / forecast.forecast.length;

      let text = createBox('💸 EXPENSE FORECAST', `Next ${days} Days`, 50) + '\n\n';

      text += bold('🎯 PREDICTION') + '\n';
      text += `Forecasted Expenses: ${formatCurrency(avgForecast * days)}\n`;
      text += `Daily Average: ${formatCurrency(avgForecast)}\n`;
      text += `Trend: ${forecast.trend}\n\n`;

      text += bold('📊 CONFIDENCE') + '\n';
      const avgConfidence =
        forecast.confidence.reduce((sum, item) => sum + item.confidence, 0) /
        forecast.confidence.length;
      text += `Confidence Level: ${avgConfidence}%\n`;
      text += `Best Case (Low): ${formatCurrency(forecast.confidence[0].lower)}\n`;
      text += `Worst Case (High): ${formatCurrency(forecast.confidence[0].upper)}\n\n`;

      text += bold('📈 ANALYSIS') + '\n';
      text += `Historical Average: ${formatCurrency(forecast.average)}\n`;
      const change = ((avgForecast - forecast.average) / forecast.average) * 100;
      text += `Expected Change: ${change >= 0 ? '+' : ''}${formatPercentage(change)}\n\n`;

      text += createDivider('━', 50) + '\n';

      if (forecast.trend === 'increasing') {
        text += '⚠️ WARNING: Expenses trending upward.\n';
        text += '💡 Review expense categories and identify cost-saving opportunities. ';
      } else if (forecast.trend === 'decreasing') {
        text += '✅ POSITIVE: Expenses trending downward.\n';
        text += '💡 Maintain cost control measures.';
      } else {
        text += '📊 Expenses are stable.\n';
        text += '💡 Continue monitoring for unexpected changes.';
      }

      await message.reply(text);
    } catch (error) {
      logger.error('Error forecasting expenses', { error: error.message });
      throw error;
    }
  },

  /**
   * Forecast cashflow
   */
  async forecastCashflow(message, filters, days) {
    try {
      const forecast = await forecastingService.forecastCashflow(filters, days, {
        method: 'linear',
      });

      const avgForecast = forecast.forecast.reduce((a, b) => a + b, 0) / forecast.forecast.length;
      const totalForecast = forecast.forecast.reduce((a, b) => a + b, 0);

      let text = createBox('💰 CASHFLOW FORECAST', `Next ${days} Days`, 50) + '\n\n';

      text += bold('🎯 PREDICTION') + '\n';
      text += `Forecasted Net:  ${formatCurrency(totalForecast)}\n`;
      text += `Daily Average: ${formatCurrency(avgForecast)}\n`;
      text += `Trend: ${this._formatTrendDirection(forecast.trend.direction)}\n\n`;

      text += bold('📊 CONFIDENCE') + '\n';
      const sampleConfidence = forecast.confidence[Math.floor(forecast.confidence.length / 2)];
      text += `Confidence Level: ${sampleConfidence.confidence}%\n`;
      text += `Range: ${formatCurrency(sampleConfidence.lower)} - ${formatCurrency(sampleConfidence.upper)}\n\n`;

      text += bold('📈 TREND ANALYSIS') + '\n';
      text += `Direction: ${forecast.trend.direction}\n`;
      text += `Strength: ${forecast.trend.strength}\n`;
      text += `Change: ${forecast.trend.changePercent}%\n`;
      text += `Historical Avg: ${formatCurrency(forecast.trend.historicalAverage)}\n`;
      text += `Forecast Avg: ${formatCurrency(forecast.trend.forecastAverage)}\n\n`;

      text += createDivider('━', 50) + '\n';
      text += this._generateCashflowInsight(forecast.trend, totalForecast);

      await message.reply(text);
    } catch (error) {
      logger.error('Error forecasting cashflow', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate forecast recommendation
   * @private
   */
  _generateForecastRecommendation(trend, changePercent) {
    if (trend === 'increasing') {
      if (changePercent > 20) {
        return '🚀 EXCELLENT: Strong growth expected!\n💡 Consider scaling operations to capitalize on growth.';
      } else {
        return '📈 GOOD: Positive growth expected.\n💡 Maintain current strategies.';
      }
    } else if (trend === 'decreasing') {
      return '⚠️ WARNING: Decline expected.\n💡 Review sales strategies and implement corrective actions.';
    } else {
      return '📊 STABLE: Consistent performance expected.\n💡 Look for growth opportunities.';
    }
  },

  /**
   * Format trend direction
   * @private
   */
  _formatTrendDirection(direction) {
    const map = {
      strong_growth: '🚀 Strong Growth',
      growth: '📈 Growth',
      stable: '➡️ Stable',
      decline: '📉 Decline',
      strong_decline: '⚠️ Strong Decline',
    };
    return map[direction] || direction;
  },

  /**
   * Generate cashflow insight
   * @private
   */
  _generateCashflowInsight(trend, totalForecast) {
    let insight = bold('💡 INSIGHTS & RECOMMENDATIONS') + '\n\n';

    if (totalForecast > 0) {
      insight += '✅ Positive cashflow expected.\n';

      if (trend.direction === 'strong_growth') {
        insight += '🚀 Strong growth trajectory!\n';
        insight += '\nRECOMMENDATIONS:\n';
        insight += '• Consider reinvesting profits for expansion\n';
        insight += '• Build cash reserves for opportunities\n';
        insight += '• Review pricing strategy for sustainability';
      } else if (trend.direction === 'growth') {
        insight += '📈 Steady improvement trend.\n';
        insight += '\nRECOMMENDATIONS:\n';
        insight += '• Maintain current operations\n';
        insight += '• Look for optimization opportunities\n';
        insight += '• Monitor key performance indicators';
      } else {
        insight += '➡️ Stable performance.\n';
        insight += '\nRECOMMENDATIONS:\n';
        insight += '• Explore growth initiatives\n';
        insight += '• Diversify revenue streams\n';
        insight += '• Invest in marketing';
      }
    } else {
      insight += '⚠️ Negative cashflow expected.\n';
      insight += '🚨 URGENT ACTION REQUIRED\n';
      insight += '\nRECOMMENDATIONS:\n';
      insight += '• Review and cut unnecessary expenses\n';
      insight += '• Focus on revenue generation\n';
      insight += '• Consider emergency funding options\n';
      insight += '• Reassess business model';
    }

    return insight;
  },
};
