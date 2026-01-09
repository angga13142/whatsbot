/**
 * Business Intelligence Service
 *
 * Advanced business metrics and KPIs
 */

const reportDataRepository = require('../database/repositories/reportDataRepository');
// const statistics = require
const logger = require('../utils/logger');
const dayjs = require('dayjs');

class BusinessIntelligenceService {
  /**
   * Calculate comprehensive business metrics
   * @param {Object} filters - Data filters
   * @returns {Promise<Object>} Business metrics
   */
  async calculateBusinessMetrics(filters) {
    try {
      const [summary, transactions, categoryData] = await Promise.all([
        reportDataRepository.getReportSummary(filters),
        reportDataRepository.executeReport(filters),
        reportDataRepository.getGroupedData(filters, 'category'),
      ]);

      const metrics = {
        profitability: this._calculateProfitabilityMetrics(summary),
        efficiency: this._calculateEfficiencyMetrics(summary, transactions),
        growth: await this._calculateGrowthMetrics(filters, summary),
        customerMetrics: await this._calculateCustomerMetrics(transactions),
        categoryPerformance: this._analyzeCategoryPerformance(categoryData),
        risks: this._assessRisks(summary, transactions),
      };

      logger.info('Business metrics calculated', { filters });

      return metrics;
    } catch (error) {
      logger.error('Error calculating business metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate customer lifetime value
   * @param {string} customerName - Customer name
   * @returns {Promise<Object>} CLV data
   */
  async calculateCustomerLifetimeValue(customerName) {
    try {
      const knex = require('../database/connection');

      // Get all customer transactions
      const transactions = await knex('transactions')
        .where('customer_name', 'like', `%${customerName}%`)
        .where('status', 'approved')
        .orderBy('transaction_date', 'asc');

      if (transactions.length === 0) {
        return null;
      }

      const totalValue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const avgOrderValue = totalValue / transactions.length;

      const firstTransaction = dayjs(transactions[0].transaction_date);
      const lastTransaction = dayjs(transactions[transactions.length - 1].transaction_date);
      const daysActive = lastTransaction.diff(firstTransaction, 'day') || 1;

      const frequency = transactions.length / (daysActive / 30); // Orders per month

      // Simple CLV = Avg Order Value × Frequency × Estimated Lifetime (months)
      const estimatedLifetime = 24; // 2 years
      const clv = avgOrderValue * frequency * estimatedLifetime;

      // Churn risk assessment
      const daysSinceLastOrder = dayjs().diff(lastTransaction, 'day');
      const churnRisk = this._assessChurnRisk(daysSinceLastOrder, frequency);

      return {
        customerName,
        totalValue,
        avgOrderValue,
        orderCount: transactions.length,
        frequency,
        daysActive,
        lastOrderDate: lastTransaction.toDate(),
        daysSinceLastOrder,
        lifetimeValue: Math.round(clv),
        churnRisk,
        segment: this._segmentCustomer(clv, frequency),
      };
    } catch (error) {
      logger.error('Error calculating CLV', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate break-even analysis
   * @param {Object} filters - Filters
   * @returns {Promise<Object>} Break-even data
   */
  async calculateBreakEven(filters) {
    try {
      const summary = await reportDataRepository.getReportSummary(filters);

      // Get fixed vs variable costs (simplified)
      const totalExpense = summary.total_expense;
      const fixedCosts = totalExpense * 0.4; // Assume 40% fixed
      const variableCosts = totalExpense * 0.6; // Assume 60% variable

      const avgRevenue = summary.total_income / (summary.total_transactions || 1);
      const avgVariableCost = variableCosts / (summary.total_transactions || 1);

      const contributionMargin = avgRevenue - avgVariableCost;
      const breakEvenUnits =
        contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;

      const breakEvenRevenue = breakEvenUnits * avgRevenue;

      const currentUnits = summary.total_transactions;
      const marginOfSafety =
        currentUnits > breakEvenUnits
          ? (((currentUnits - breakEvenUnits) / currentUnits) * 100).toFixed(1)
          : 0;

      return {
        fixedCosts,
        variableCosts,
        avgRevenuePerUnit: avgRevenue,
        avgVariableCostPerUnit: avgVariableCost,
        contributionMargin,
        breakEvenUnits,
        breakEvenRevenue,
        currentUnits,
        marginOfSafety: parseFloat(marginOfSafety),
        status: currentUnits >= breakEvenUnits ? 'profitable' : 'below_breakeven',
      };
    } catch (error) {
      logger.error('Error calculating break-even', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate profitability metrics
   * @private
   */
  _calculateProfitabilityMetrics(summary) {
    const profitMargin = summary.total_income > 0 ? (summary.net / summary.total_income) * 100 : 0;

    const expenseRatio =
      summary.total_income > 0 ? (summary.total_expense / summary.total_income) * 100 : 0;

    const roi = summary.total_expense > 0 ? (summary.net / summary.total_expense) * 100 : 0;

    return {
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      expenseRatio: parseFloat(expenseRatio.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      grossProfit: summary.net,
      rating: this._rateProfitability(profitMargin),
    };
  }

  /**
   * Calculate efficiency metrics
   * @private
   */
  // eslint-disable-next-line no-unused-vars
  // eslint-disable-next-line no-unused-vars
  _calculateEfficiencyMetrics(summary, transactions) {
    // eslint-disable-line no-unused-vars
    const avgTransactionValue =
      summary.total_transactions > 0 ? summary.total_income / summary.total_transactions : 0;

    const avgTransactionCost =
      summary.total_transactions > 0 ? summary.total_expense / summary.total_transactions : 0;

    return {
      avgTransactionValue,
      avgTransactionCost,
      transactionEfficiency: avgTransactionValue / Math.max(avgTransactionCost, 1),
      totalTransactions: summary.total_transactions,
    };
  }

  /**
   * Calculate growth metrics
   * @private
   */
  async _calculateGrowthMetrics(filters, currentSummary) {
    try {
      // Get previous period data
      const start = dayjs(filters.startDate);
      const end = dayjs(filters.endDate);
      const duration = end.diff(start, 'day');

      const previousFilters = {
        startDate: start.subtract(duration, 'day').toDate(),
        endDate: start.subtract(1, 'day').toDate(),
      };

      const previousSummary = await reportDataRepository.getReportSummary(previousFilters);

      const revenueGrowth =
        previousSummary.total_income > 0
          ? ((currentSummary.total_income - previousSummary.total_income) /
              previousSummary.total_income) *
            100
          : 0;

      const profitGrowth =
        previousSummary.net > 0
          ? ((currentSummary.net - previousSummary.net) / previousSummary.net) * 100
          : 0;

      return {
        revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
        profitGrowth: parseFloat(profitGrowth.toFixed(2)),
        trend: revenueGrowth > 0 ? 'growing' : revenueGrowth < 0 ? 'declining' : 'stable',
      };
    } catch (error) {
      return {
        revenueGrowth: 0,
        profitGrowth: 0,
        trend: 'unknown',
      };
    }
  }

  /**
   * Calculate customer metrics
   * @private
   */
  async _calculateCustomerMetrics(transactions) {
    const customersWithNames = transactions.filter((t) => t.customer_name);

    if (customersWithNames.length === 0) {
      return {
        totalCustomers: 0,
        avgRevenuePerCustomer: 0,
        topCustomers: [],
      };
    }

    const customerRevenue = {};
    customersWithNames.forEach((t) => {
      const name = t.customer_name;
      if (!customerRevenue[name]) {
        customerRevenue[name] = 0;
      }
      customerRevenue[name] += parseFloat(t.amount);
    });

    const uniqueCustomers = Object.keys(customerRevenue).length;
    const totalRevenue = Object.values(customerRevenue).reduce((a, b) => a + b, 0);
    const avgRevenuePerCustomer = totalRevenue / uniqueCustomers;

    const topCustomers = Object.entries(customerRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalCustomers: uniqueCustomers,
      avgRevenuePerCustomer,
      topCustomers,
    };
  }

  /**
   * Analyze category performance
   * @private
   */
  _analyzeCategoryPerformance(categoryData) {
    if (!categoryData || categoryData.length === 0) {
      return { topPerforming: [], underPerforming: [] };
    }

    const sorted = [...categoryData].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

    return {
      topPerforming: sorted.slice(0, 3).map((c) => ({
        name: c.category_name,
        total: parseFloat(c.total),
        count: parseInt(c.count),
      })),
      underPerforming: sorted
        .slice(-3)
        .reverse()
        .map((c) => ({
          name: c.category_name,
          total: parseFloat(c.total),
          count: parseInt(c.count),
        })),
    };
  }

  /**
   * Assess business risks
   * @private
   */
  // eslint-disable-next-line no-unused-vars
  _assessRisks(summary, transactions) {
    const risks = [];

    // Negative cashflow risk
    if (summary.net < 0) {
      risks.push({
        type: 'cashflow',
        severity: 'high',
        description: 'Negative cashflow detected',
      });
    }

    // High expense ratio risk
    const expenseRatio =
      summary.total_income > 0 ? (summary.total_expense / summary.total_income) * 100 : 0;

    if (expenseRatio > 80) {
      risks.push({
        type: 'expense_ratio',
        severity: 'medium',
        description: 'High expense ratio (>80%)',
      });
    }

    // Low transaction volume risk
    if (summary.total_transactions < 10) {
      risks.push({
        type: 'volume',
        severity: 'low',
        description: 'Low transaction volume',
      });
    }

    return {
      risks,
      riskScore: this._calculateRiskScore(risks),
      overallRisk:
        risks.length === 0 ? 'low' : risks.some((r) => r.severity === 'high') ? 'high' : 'medium',
    };
  }

  /**
   * Rate profitability
   * @private
   */
  _rateProfitability(profitMargin) {
    if (profitMargin >= 30) return 'excellent';
    if (profitMargin >= 20) return 'good';
    if (profitMargin >= 10) return 'fair';
    if (profitMargin >= 0) return 'poor';
    return 'negative';
  }

  /**
   * Assess churn risk
   * @private
   */
  _assessChurnRisk(daysSinceLastOrder, frequency) {
    const expectedDays = 30 / frequency; // Expected days between orders

    if (daysSinceLastOrder > expectedDays * 3) return 'high';
    if (daysSinceLastOrder > expectedDays * 2) return 'medium';
    return 'low';
  }

  /**
   * Segment customer
   * @private
   */
  _segmentCustomer(clv, frequency) {
    if (clv > 50000000 && frequency > 4) return 'VIP';
    if (clv > 20000000) return 'high_value';
    if (frequency > 2) return 'frequent';
    return 'regular';
  }

  /**
   * Calculate risk score
   * @private
   */
  _calculateRiskScore(risks) {
    const severityScores = { high: 30, medium: 20, low: 10 };
    return risks.reduce((score, risk) => score + severityScores[risk.severity], 0);
  }
}

module.exports = new BusinessIntelligenceService();
