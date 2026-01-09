/**
 * Statistics Helper Utility
 *
 * Statistical functions and calculations
 */

const statistics = require('simple-statistics');

/**
 * Calculate descriptive statistics
 * @param {Array<number>} data - Data array
 * @returns {Object} Statistics
 */
function calculateDescriptiveStats(data) {
  if (!data || data.length === 0) {
    return null;
  }

  return {
    mean: statistics.mean(data),
    median: statistics.median(data),
    mode: statistics.mode(data),
    min: statistics.min(data),
    max: statistics.max(data),
    range: statistics.max(data) - statistics.min(data),
    variance: statistics.variance(data),
    standardDeviation: statistics.standardDeviation(data),
    sum: statistics.sum(data),
    count: data.length,
  };
}

/**
 * Calculate percentiles
 * @param {Array<number>} data - Data array
 * @param {Array<number>} percentiles - Percentiles to calculate
 * @returns {Object}
 */
function calculatePercentiles(data, percentiles = [25, 50, 75, 90, 95]) {
  const sorted = [...data].sort((a, b) => a - b);
  const result = {};

  percentiles.forEach((p) => {
    result[`p${p}`] = statistics.quantile(sorted, p / 100);
  });

  return result;
}

/**
 * Detect outliers using IQR method
 * @param {Array<number>} data - Data array
 * @returns {Object} Outliers data
 */
function detectOutliers(data) {
  const sorted = [...data].sort((a, b) => a - b);

  const q1 = statistics.quantile(sorted, 0.25);
  const q3 = statistics.quantile(sorted, 0.75);
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = data.filter((value) => value < lowerBound || value > upperBound);

  return {
    outliers,
    lowerBound,
    upperBound,
    count: outliers.length,
    percentage: ((outliers.length / data.length) * 100).toFixed(2),
  };
}

/**
 * Calculate correlation coefficient
 * @param {Array<number>} x - X values
 * @param {Array<number>} y - Y values
 * @returns {number} Correlation coefficient
 */
function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const pairs = x.map((xi, i) => [xi, y[i]]);
  return statistics.sampleCorrelation(pairs);
}

/**
 * Calculate growth rate
 * @param {number} start - Start value
 * @param {number} end - End value
 * @returns {number} Growth rate (%)
 */
function calculateGrowthRate(start, end) {
  if (start === 0) return end > 0 ? 100 : 0;
  return ((end - start) / start) * 100;
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 * @param {number} startValue - Start value
 * @param {number} endValue - End value
 * @param {number} years - Number of years
 * @returns {number} CAGR (%)
 */
function calculateCAGR(startValue, endValue, years) {
  if (startValue === 0 || years === 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Calculate moving average
 * @param {Array<number>} data - Data array
 * @param {number} window - Window size
 * @returns {Array<number>} Moving averages
 */
function calculateMovingAverage(data, window = 7) {
  const result = [];

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(null);
    } else {
      const windowData = data.slice(i - window + 1, i + 1);
      result.push(statistics.mean(windowData));
    }
  }

  return result;
}

/**
 * Calculate exponential moving average
 * @param {Array<number>} data - Data array
 * @param {number} alpha - Smoothing factor (0-1)
 * @returns {Array<number>} EMA values
 */
function calculateEMA(data, alpha = 0.3) {
  const result = [];
  let ema = data[0];

  result.push(ema);

  for (let i = 1; i < data.length; i++) {
    ema = alpha * data[i] + (1 - alpha) * ema;
    result.push(ema);
  }

  return result;
}

/**
 * Calculate z-scores
 * @param {Array<number>} data - Data array
 * @returns {Array<number>} Z-scores
 */
function calculateZScores(data) {
  const mean = statistics.mean(data);
  const stdDev = statistics.standardDeviation(data);

  return data.map((value) => (value - mean) / stdDev);
}

/**
 * Normalize data to 0-1 range
 * @param {Array<number>} data - Data array
 * @returns {Array<number>} Normalized values
 */
function normalizeData(data) {
  const min = statistics.min(data);
  const max = statistics.max(data);
  const range = max - min;

  if (range === 0) return data.map(() => 0);

  return data.map((value) => (value - min) / range);
}

/**
 * Calculate trend (linear regression slope)
 * @param {Array<number>} data - Data array
 * @returns {string} Trend direction
 */
function calculateTrend(data) {
  if (data.length < 2) return 'insufficient_data';

  const x = Array.from({ length: data.length }, (_, i) => i);
  const pairs = x.map((xi, i) => [xi, data[i]]);

  const regression = statistics.linearRegression(pairs);
  const slope = regression.m;

  if (slope > 0.1) return 'increasing';
  if (slope < -0.1) return 'decreasing';
  return 'stable';
}

/**
 * Calculate coefficient of variation
 * @param {Array<number>} data - Data array
 * @returns {number} CV (%)
 */
function calculateCV(data) {
  const mean = statistics.mean(data);
  const stdDev = statistics.standardDeviation(data);

  if (mean === 0) return 0;

  return (stdDev / mean) * 100;
}

module.exports = {
  calculateDescriptiveStats,
  calculatePercentiles,
  detectOutliers,
  calculateCorrelation,
  calculateGrowthRate,
  calculateCAGR,
  calculateMovingAverage,
  calculateEMA,
  calculateZScores,
  normalizeData,
  calculateTrend,
  calculateCV,
};
