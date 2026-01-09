/**
 * Chart Templates
 *
 * Predefined chart templates
 */

const chartBuilder = require('../../utils/chartBuilder');
const { getColorByType } = require('../../utils/colorPalette');

module.exports = {
  /**
   * Income vs Expense template
   */
  incomeVsExpense(data) {
    return chartBuilder.createBarChart({
      labels: ['Income', 'Expense'],
      datasets: [
        {
          label: 'Amount',
          data: [data.income, data.expense],
          backgroundColor: [getColorByType('income'), getColorByType('expense')],
          borderRadius: 8,
        },
      ],
      title: 'Income vs Expense',
    });
  },

  /**
   * Monthly trend template
   */
  monthlyTrend(data) {
    return chartBuilder.createLineChart({
      labels: data.months,
      datasets: [
        {
          label: 'Net Cashflow',
          data: data.values,
          color: getColorByType('net'),
          fill: true,
        },
      ],
      title: 'Monthly Trend',
    });
  },

  /**
   * Category breakdown template
   */
  categoryBreakdown(data) {
    return chartBuilder.createPieChart({
      labels: data.labels,
      values: data.values,
      title: 'Category Breakdown',
    });
  },
};
