/**
 * Date Range Helper Utility
 *
 * Helper functions for date range operations
 */

const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
const quarterOfYear = require('dayjs/plugin/quarterOfYear');

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

module.exports = {
  /**
   * Get preset date ranges
   */
  getPresetRanges() {
    const now = dayjs();

    return {
      today: {
        label: 'Hari Ini',
        startDate: now.startOf('day').format('YYYY-MM-DD'),
        endDate: now.endOf('day').format('YYYY-MM-DD'),
      },
      yesterday: {
        label: 'Kemarin',
        startDate: now.subtract(1, 'day').startOf('day').format('YYYY-MM-DD'),
        endDate: now.subtract(1, 'day').endOf('day').format('YYYY-MM-DD'),
      },
      this_week: {
        label: 'Minggu Ini',
        startDate: now.startOf('isoWeek').format('YYYY-MM-DD'),
        endDate: now.endOf('day').format('YYYY-MM-DD'),
      },
      last_week: {
        label: 'Minggu Lalu',
        startDate: now.subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD'),
        endDate: now.subtract(1, 'week').endOf('isoWeek').format('YYYY-MM-DD'),
      },
      this_month: {
        label: 'Bulan Ini',
        startDate: now.startOf('month').format('YYYY-MM-DD'),
        endDate: now.endOf('day').format('YYYY-MM-DD'),
      },
      last_month: {
        label: 'Bulan Lalu',
        startDate: now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
        endDate: now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
      },
      this_quarter: {
        label: 'Kuartal Ini',
        startDate: now.startOf('quarter').format('YYYY-MM-DD'),
        endDate: now.endOf('day').format('YYYY-MM-DD'),
      },
      this_year: {
        label: 'Tahun Ini',
        startDate: now.startOf('year').format('YYYY-MM-DD'),
        endDate: now.endOf('day').format('YYYY-MM-DD'),
      },
      last_7_days: {
        label: '7 Hari Terakhir',
        startDate: now.subtract(7, 'day').startOf('day').format('YYYY-MM-DD'),
        endDate: now.endOf('day').format('YYYY-MM-DD'),
      },
      last_30_days: {
        label: '30 Hari Terakhir',
        startDate: now.subtract(30, 'day').startOf('day').format('YYYY-MM-DD'),
        endDate: now.endOf('day').format('YYYY-MM-DD'),
      },
      last_90_days: {
        label: '90 Hari Terakhir',
        startDate: now.subtract(90, 'day').startOf('day').format('YYYY-MM-DD'),
        endDate: now.endOf('day').format('YYYY-MM-DD'),
      },
    };
  },

  /**
   * Get comparison date range
   */
  getComparisonRange(preset) {
    const ranges = this.getPresetRanges();
    const current = ranges[preset];

    if (!current) {
      throw new Error('Invalid preset');
    }

    const start = dayjs(current.startDate);
    const end = dayjs(current.endDate);
    const duration = end.diff(start, 'day');

    return {
      current: { startDate: current.startDate, endDate: current.endDate, label: current.label },
      previous: {
        startDate: start.subtract(duration + 1, 'day').format('YYYY-MM-DD'),
        endDate: start.subtract(1, 'day').format('YYYY-MM-DD'),
        label: `Previous ${duration + 1} Days`,
      },
    };
  },

  /**
   * Parse custom date range
   */
  parseCustomRange(rangeString) {
    const parts = rangeString.split(/\s+to\s+|\s+-\s+|\s+sampai\s+/i);

    if (parts.length !== 2) {
      throw new Error('Invalid date range format. Use: YYYY-MM-DD to YYYY-MM-DD');
    }

    const startDate = dayjs(parts[0].trim());
    const endDate = dayjs(parts[1].trim());

    if (!startDate.isValid() || !endDate.isValid()) {
      throw new Error('Invalid date format');
    }

    if (endDate.isBefore(startDate)) {
      throw new Error('End date must be after start date');
    }

    return {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      duration: endDate.diff(startDate, 'day') + 1,
    };
  },

  /**
   * Get date intervals for time series
   */
  getDateIntervals(startDate, endDate, interval = 'day') {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const intervals = [];

    let current = start;

    while (current.isBefore(end) || current.isSame(end, interval)) {
      intervals.push({
        start: current.startOf(interval).format('YYYY-MM-DD'),
        end: current.endOf(interval).format('YYYY-MM-DD'),
        label: this.formatIntervalLabel(current, interval),
      });

      current = current.add(1, interval);
    }

    return intervals;
  },

  /**
   * Format interval label
   */
  formatIntervalLabel(date, interval) {
    const d = dayjs(date);
    switch (interval) {
      case 'day':
        return d.format('DD MMM YYYY');
      case 'week':
        return `Week ${d.isoWeek()} - ${d.format('YYYY')}`;
      case 'month':
        return d.format('MMM YYYY');
      case 'quarter':
        return `Q${d.quarter()} ${d.format('YYYY')}`;
      case 'year':
        return d.format('YYYY');
      default:
        return d.format('DD MMM YYYY');
    }
  },

  /**
   * Calculate optimal interval based on date range
   */
  calculateOptimalInterval(startDate, endDate) {
    const days = dayjs(endDate).diff(dayjs(startDate), 'day');

    if (days <= 7) return 'day';
    if (days <= 60) return 'week';
    if (days <= 365) return 'month';
    return 'quarter';
  },

  /**
   * Validate date range
   */
  validateDateRange(startDate, endDate, options = {}) {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const errors = [];

    if (!start.isValid()) errors.push('Start date is invalid');
    if (!end.isValid()) errors.push('End date is invalid');

    if (errors.length > 0) return { valid: false, errors };

    if (end.isBefore(start)) errors.push('End date must be after start date');

    const maxDays = options.maxDays || 365;
    const duration = end.diff(start, 'day');

    if (duration > maxDays) errors.push(`Date range cannot exceed ${maxDays} days`);

    return { valid: errors.length === 0, errors, duration };
  },

  /**
   * Get relative date description
   */
  getRelativeDescription(date) {
    const now = dayjs();
    const target = dayjs(date);
    const diffDays = now.diff(target, 'day');

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays === -1) return 'Besok';
    if (diffDays > 0 && diffDays <= 7) return `${diffDays} hari lalu`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} hari lagi`;

    return target.format('DD MMM YYYY');
  },
};
