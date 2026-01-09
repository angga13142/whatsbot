/**
 * Insight Generator Utility
 *
 * Generate natural language insights from data
 */

const { formatPercentage } = require('./formatter');

class InsightGenerator {
  /**
   * Generate insights from report data
   * @param {Object} reportData - Report data
   * @param {Object} comparison - Comparison data
   * @returns {Array<Object>} Insights
   */
  generateInsights(reportData, comparison = null) {
    const insights = [];

    // Revenue insights
    if (reportData.summary) {
      insights.push(...this._analyzeRevenue(reportData.summary, comparison));

      // Expense insights
      insights.push(...this._analyzeExpenses(reportData.summary, comparison));

      // Profitability insights
      insights.push(...this._analyzeProfitability(reportData.summary));
    }

    // Trend insights
    if (reportData.trendData) {
      insights.push(...this._analyzeTrends(reportData.trendData));
    }

    // Category insights
    if (reportData.groupedData) {
      insights.push(...this._analyzeCategories(reportData.groupedData));
    }

    // Sort by priority
    return insights.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Analyze revenue
   * @private
   */
  _analyzeRevenue(summary, comparison) {
    const insights = [];

    if (comparison && comparison.total_income) {
      const change =
        ((summary.total_income - comparison.total_income) / comparison.total_income) * 100;

      if (change > 20) {
        insights.push({
          type: 'revenue',
          priority: 'high',
          sentiment: 'positive',
          title: 'Strong Revenue Growth',
          message: `Revenue increased by ${formatPercentage(Math.abs(change))} compared to previous period. Excellent performance!`,
          recommendation:
            'Maintain current strategies and consider scaling successful initiatives.',
        });
      } else if (change < -20) {
        insights.push({
          type: 'revenue',
          priority: 'critical',
          sentiment: 'negative',
          title: 'Revenue Decline',
          message: `Revenue decreased by ${formatPercentage(Math.abs(change))}. Immediate attention required.`,
          recommendation:
            'Review sales strategies, identify causes of decline, and implement corrective actions.',
        });
      }
    }

    return insights;
  }

  /**
   * Analyze expenses
   * @private
   */
  _analyzeExpenses(summary, comparison) {
    const insights = [];

    const expenseRatio =
      summary.total_income > 0 ? (summary.total_expense / summary.total_income) * 100 : 0;

    if (expenseRatio > 80) {
      insights.push({
        type: 'expense',
        priority: 'high',
        sentiment: 'warning',
        title: 'High Expense Ratio',
        message: `Expenses are ${formatPercentage(expenseRatio)} of revenue. This leaves minimal profit margin.`,
        recommendation:
          'Review and optimize expenses. Identify areas for cost reduction without compromising quality.',
      });
    }

    if (comparison && comparison.total_expense) {
      const change =
        ((summary.total_expense - comparison.total_expense) / comparison.total_expense) * 100;

      if (change > 30) {
        insights.push({
          type: 'expense',
          priority: 'medium',
          sentiment: 'warning',
          title: 'Expense Increase',
          message: `Expenses increased by ${formatPercentage(Math.abs(change))}. Monitor closely.`,
          recommendation:
            'Analyze expense categories to identify unexpected increases. Ensure increases are justified.',
        });
      }
    }

    return insights;
  }

  /**
   * Analyze profitability
   * @private
   */
  _analyzeProfitability(summary) {
    const insights = [];

    const profitMargin = summary.total_income > 0 ? (summary.net / summary.total_income) * 100 : 0;

    if (profitMargin > 30) {
      insights.push({
        type: 'profitability',
        priority: 'low',
        sentiment: 'positive',
        title: 'Excellent Profit Margin',
        message: `Profit margin is ${formatPercentage(profitMargin)}. Outstanding performance!`,
        recommendation: 'Continue current operations. Consider reinvesting profits for growth.',
      });
    } else if (profitMargin < 10 && profitMargin > 0) {
      insights.push({
        type: 'profitability',
        priority: 'medium',
        sentiment: 'warning',
        title: 'Low Profit Margin',
        message: `Profit margin is only ${formatPercentage(profitMargin)}. Room for improvement.`,
        recommendation: 'Focus on increasing revenue or reducing costs to improve margins.',
      });
    } else if (profitMargin <= 0) {
      insights.push({
        type: 'profitability',
        priority: 'critical',
        sentiment: 'negative',
        title: 'Negative Cashflow',
        message: 'Business is operating at a loss. Urgent action required.',
        recommendation:
          'Review business model, cut unnecessary expenses, and focus on revenue generation.',
      });
    }

    return insights;
  }

  /**
   * Analyze trends
   * @private
   */
  _analyzeTrends(trendData) {
    const insights = [];

    if (trendData.length < 5) return insights;

    const recent = trendData.slice(-5);
    const netValues = recent.map((d) => parseFloat(d.income || 0) - parseFloat(d.expense || 0));

    // Check for consistent growth
    let increasing = 0;
    for (let i = 1; i < netValues.length; i++) {
      if (netValues[i] > netValues[i - 1]) increasing++;
    }

    if (increasing >= 4) {
      insights.push({
        type: 'trend',
        priority: 'low',
        sentiment: 'positive',
        title: 'Positive Trend',
        message: 'Cashflow has been consistently improving over the last 5 periods.',
        recommendation: 'Momentum is building. Continue current strategies.',
      });
    } else if (increasing === 0) {
      insights.push({
        type: 'trend',
        priority: 'high',
        sentiment: 'negative',
        title: 'Declining Trend',
        message: 'Cashflow has been consistently declining. Trend reversal needed.',
        recommendation: 'Investigate root causes and implement turnaround strategies immediately.',
      });
    }

    return insights;
  }

  /**
   * Analyze categories
   * @private
   */
  _analyzeCategories(groupedData) {
    const insights = [];

    if (groupedData.length === 0) return insights;

    // Top performer
    const top = groupedData[0];
    const topPercent =
      (parseFloat(top.total) / groupedData.reduce((sum, item) => sum + parseFloat(item.total), 0)) *
      100;

    if (topPercent > 50) {
      insights.push({
        type: 'category',
        priority: 'medium',
        sentiment: 'warning',
        title: 'High Concentration Risk',
        message: `${top.category_name || top.type} accounts for ${formatPercentage(topPercent)} of total. High dependency on single category.`,
        recommendation: 'Diversify revenue streams to reduce risk.',
      });
    }

    return insights;
  }

  /**
   * Generate recommendations
   * @param {Object} businessMetrics - Business metrics
   * @returns {Array<string>} Recommendations
   */
  generateRecommendations(businessMetrics) {
    const recommendations = [];

    // Based on profitability
    if (businessMetrics.profitability.profitMargin < 20) {
      recommendations.push(
        'Consider increasing prices or reducing costs to improve profit margins.'
      );
    }

    // Based on growth
    if (businessMetrics.growth.revenueGrowth < 0) {
      recommendations.push('Focus on customer acquisition and retention strategies.');
    }

    // Based on efficiency
    if (businessMetrics.efficiency.transactionEfficiency < 1.5) {
      recommendations.push('Optimize operations to improve transaction efficiency.');
    }

    return recommendations;
  }
}

module.exports = new InsightGenerator();
