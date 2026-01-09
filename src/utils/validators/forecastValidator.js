class ForecastValidator {
  validateForecastRequest(filters, forecastDays, options = {}) {
    const errors = [];

    // Validate forecast days
    if (!Number.isInteger(forecastDays) || forecastDays < 1 || forecastDays > 90) {
      errors.push('Forecast days must be between 1 and 90');
    }

    // Validate filters
    if (!filters || typeof filters !== 'object') {
      errors.push('Filters must be provided');
    }

    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);

      if (isNaN(start.getTime())) {
        errors.push('Invalid start date');
      }

      if (isNaN(end.getTime())) {
        errors.push('Invalid end date');
      }

      if (start >= end) {
        errors.push('Start date must be before end date');
      }
    }

    // Validate method
    if (options.method && !['linear', 'moving_average', 'exponential'].includes(options.method)) {
      errors.push('Invalid forecasting method');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = new ForecastValidator();
