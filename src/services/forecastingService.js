/**
 * Forecasting Service
 *
 * Predictive analytics and forecasting algorithms
 */

const reportDataRepository = require('../database/repositories/reportDataRepository');
const statistics = require('simple-statistics');
const logger = require('../utils/logger');
const dayjs = require('dayjs');
const forecastValidator = require('../utils/validators/forecastValidator');

class ForecastingService {
  /**
   * Forecast cashflow for next N days
   * @param {Object} historicalFilters - Historical data filters
   * @param {number} forecastDays - Days to forecast
   * @param {Object} options - Forecast options
   * @returns {Promise<Object>} Forecast data
   */
  async forecastCashflow(historicalFilters, forecastDays = 30, options = {}) {
    // Validate inputs
    const validation = forecastValidator.validateForecastRequest(
      historicalFilters,
      forecastDays,
      options
    );

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      // Get historical data
      const trendData = await reportDataRepository.getTrendData(historicalFilters, 'day');

      if (trendData.length < 7) {
        throw new Error('Insufficient historical data (minimum 7 days required)');
      }

      // Calculate net cashflow for each day
      const historicalValues = trendData.map((d) => {
        const income = parseFloat(d.income || 0);
        const expense = parseFloat(d.expense || 0);
        return income - expense;
      });

      // Generate forecast using selected method
      const method = options.method || 'linear';
      let forecast;

      switch (method) {
        case 'linear':
          forecast = this._linearRegressionForecast(historicalValues, forecastDays);
          break;
        case 'moving_average':
          forecast = this._movingAverageForecast(historicalValues, forecastDays);
          break;
        case 'exponential':
          forecast = this._exponentialSmoothingForecast(historicalValues, forecastDays);
          break;
        default:
          forecast = this._linearRegressionForecast(historicalValues, forecastDays);
      }

      // Calculate confidence intervals
      const confidence = this._calculateConfidenceIntervals(historicalValues, forecast.values);

      // Analyze trend
      const trend = this._analyzeTrend(historicalValues, forecast.values);

      logger.info('Cashflow forecast generated', {
        forecastDays,
        method,
        dataPoints: historicalValues.length,
      });

      return {
        forecast: forecast.values,
        confidence,
        trend,
        method,
        historicalData: historicalValues,
        dates: this._generateForecastDates(forecastDays),
        metadata: {
          historicalPeriod: trendData.length,
          forecastPeriod: forecastDays,
          accuracy: forecast.accuracy,
        },
      };
    } catch (error) {
      logger.error('Error forecasting cashflow', { error: error.message });
      throw error;
    }
  }

  /**
   * Forecast revenue
   * @param {Object} filters - Filters
   * @param {number} days - Days to forecast
   * @returns {Promise<Object>}
   */
  async forecastRevenue(filters, days = 30) {
    try {
      const trendData = await reportDataRepository.getTrendData(filters, 'day');

      const revenueData = trendData.map((d) => parseFloat(d.income || 0));

      if (revenueData.length < 7) {
        throw new Error('Insufficient data for revenue forecast');
      }

      const forecast = this._linearRegressionForecast(revenueData, days);
      const confidence = this._calculateConfidenceIntervals(revenueData, forecast.values);

      return {
        forecast: forecast.values,
        confidence,
        average: statistics.mean(revenueData),
        trend: this._determineTrendDirection(revenueData),
        dates: this._generateForecastDates(days),
      };
    } catch (error) {
      logger.error('Error forecasting revenue', { error: error.message });
      throw error;
    }
  }

  /**
   * Forecast expenses
   * @param {Object} filters - Filters
   * @param {number} days - Days to forecast
   * @returns {Promise<Object>}
   */
  async forecastExpenses(filters, days = 30) {
    try {
      const trendData = await reportDataRepository.getTrendData(filters, 'day');

      const expenseData = trendData.map((d) => parseFloat(d.expense || 0));

      if (expenseData.length < 7) {
        throw new Error('Insufficient data for expense forecast');
      }

      const forecast = this._linearRegressionForecast(expenseData, days);
      const confidence = this._calculateConfidenceIntervals(expenseData, forecast.values);

      return {
        forecast: forecast.values,
        confidence,
        average: statistics.mean(expenseData),
        trend: this._determineTrendDirection(expenseData),
        dates: this._generateForecastDates(days),
      };
    } catch (error) {
      logger.error('Error forecasting expenses', { error: error.message });
      throw error;
    }
  }

  /**
   * Linear regression forecast
   * @private
   */
  _linearRegressionForecast(data, periods) {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);

    // Calculate linear regression
    const regression = statistics.linearRegression([x.map((xi, i) => [xi, data[i]])]);

    const slope = regression.m;
    const intercept = regression.b;

    // Generate forecast
    const forecast = [];
    for (let i = 0; i < periods; i++) {
      const value = slope * (n + i) + intercept;
      forecast.push(Math.round(value));
    }

    // Calculate R-squared for accuracy
    const predictions = x.map((xi) => slope * xi + intercept);
    const rSquared = statistics.rSquared(data, predictions);

    return {
      values: forecast,
      accuracy: rSquared,
    };
  }

  /**
   * Moving average forecast
   * @private
   */
  _movingAverageForecast(data, periods, window = 7) {
    // Calculate moving average of last window periods
    const lastWindow = data.slice(-window);
    const average = statistics.mean(lastWindow);

    // Simple forecast: repeat the average
    const forecast = Array(periods).fill(Math.round(average));

    return {
      values: forecast,
      accuracy: 0.7, // Moving average typically has moderate accuracy
    };
  }

  /**
   * Exponential smoothing forecast
   * @private
   */
  _exponentialSmoothingForecast(data, periods, alpha = 0.3) {
    // Initialize with first value
    let smoothed = data[0];
    const smoothedValues = [smoothed];

    // Calculate smoothed values
    for (let i = 1; i < data.length; i++) {
      smoothed = alpha * data[i] + (1 - alpha) * smoothed;
      smoothedValues.push(smoothed);
    }

    // Forecast: repeat last smoothed value with slight trend
    const trend =
      (smoothedValues[smoothedValues.length - 1] - smoothedValues[0]) / smoothedValues.length;
    const forecast = [];

    for (let i = 0; i < periods; i++) {
      const value = smoothed + trend * (i + 1);
      forecast.push(Math.round(value));
    }

    return {
      values: forecast,
      accuracy: 0.75,
    };
  }

  /**
   * Calculate confidence intervals
   * @private
   */
  _calculateConfidenceIntervals(historical, forecast) {
    const historicalStdDev = statistics.standardDeviation(historical);
    const z = 1.96; // 95% confidence

    return forecast.map((value) => ({
      predicted: value,
      lower: Math.round(value - z * historicalStdDev),
      upper: Math.round(value + z * historicalStdDev),
      confidence: 95,
    }));
  }

  /**
   * Analyze trend
   * @private
   */
  _analyzeTrend(historical, forecast) {
    const historicalAvg = statistics.mean(historical);
    const forecastAvg = statistics.mean(forecast);

    const change = ((forecastAvg - historicalAvg) / historicalAvg) * 100;

    let direction, strength;

    if (change > 10) {
      direction = 'strong_growth';
      strength = 'high';
    } else if (change > 5) {
      direction = 'growth';
      strength = 'moderate';
    } else if (change > -5) {
      direction = 'stable';
      strength = 'low';
    } else if (change > -10) {
      direction = 'decline';
      strength = 'moderate';
    } else {
      direction = 'strong_decline';
      strength = 'high';
    }

    return {
      direction,
      strength,
      changePercent: change.toFixed(2),
      historicalAverage: Math.round(historicalAvg),
      forecastAverage: Math.round(forecastAvg),
    };
  }

  /**
   * Determine trend direction
   * @private
   */
  _determineTrendDirection(data) {
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = statistics.mean(firstHalf);
    const secondAvg = statistics.mean(secondHalf);

    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate forecast dates
   * @private
   */
  _generateForecastDates(days) {
    const dates = [];
    for (let i = 1; i <= days; i++) {
      dates.push(dayjs().add(i, 'day').format('YYYY-MM-DD'));
    }
    return dates;
  }

  /**
   * Get forecast accuracy score
   * @param {Array} actual - Actual values
   * @param {Array} predicted - Predicted values
   * @returns {number} Accuracy score (0-100)
   */
  calculateAccuracy(actual, predicted) {
    if (actual.length !== predicted.length || actual.length === 0) {
      return 0;
    }

    const errors = actual.map((a, i) => Math.abs(a - predicted[i]) / Math.max(a, 1));
    const mape = statistics.mean(errors) * 100; // Mean Absolute Percentage Error

    return Math.max(0, 100 - mape);
  }
}

module.exports = new ForecastingService();
