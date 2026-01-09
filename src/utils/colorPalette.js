/**
 * Color Palette Utility
 *
 * Color schemes and palette generation
 */

const chartConfig = require('../config/chartConfig');

/**
 * Get color by type
 * @param {string} type - Color type (income, expense, net)
 * @returns {string} Hex color
 */
function getColorByType(type) {
  return chartConfig.colors.primary[type] || chartConfig.colors.primary.neutral;
}

/**
 * Get chart colors array
 * @param {number} count - Number of colors needed
 * @returns {Array<string>}
 */
function getChartColors(count) {
  const colors = chartConfig.colors.chart;

  if (count <= colors.length) {
    return colors.slice(0, count);
  }

  // Generate more colors if needed
  const result = [...colors];
  while (result.length < count) {
    result.push(generateRandomColor());
  }

  return result;
}

/**
 * Get gradient colors
 * @param {string} type - Gradient type
 * @returns {Array<string>}
 */
function getGradientColors(type) {
  return chartConfig.colors.gradient[type] || chartConfig.colors.gradient.neutral;
}

/**
 * Generate random color
 * @returns {string} Hex color
 */
function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Adjust color brightness
 * @param {string} color - Hex color
 * @param {number} percent - Brightness adjustment (-100 to 100)
 * @returns {string} Adjusted hex color
 */
function adjustBrightness(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Add transparency to color
 * @param {string} color - Hex color
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color
 */
function addTransparency(color, alpha) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get semantic colors based on value
 * @param {number} value - Numeric value
 * @param {Object} thresholds - Threshold values
 * @returns {string} Color
 */
function getSemanticColor(value, thresholds = {}) {
  const { good = 0, warning = -1000000, critical = -5000000 } = thresholds;

  if (value >= good) {
    return chartConfig.colors.primary.income;
  } else if (value >= warning) {
    return chartConfig.colors.chart[2]; // Amber
  } else if (value >= critical) {
    return chartConfig.colors.chart[6]; // Orange
  } else {
    return chartConfig.colors.primary.expense;
  }
}

/**
 * Create gradient definition for canvas
 * @param {Object} ctx - Canvas context
 * @param {Array} colors - Color array
 * @param {string} direction - Gradient direction (vertical, horizontal)
 * @returns {CanvasGradient}
 */
function createCanvasGradient(ctx, colors, direction = 'vertical') {
  const gradient =
    direction === 'vertical'
      ? ctx.createLinearGradient(0, 0, 0, 400)
      : ctx.createLinearGradient(0, 0, 400, 0);

  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });

  return gradient;
}

/**
 * Get contrasting text color
 * @param {string} backgroundColor - Background hex color
 * @returns {string} Text color (black or white)
 */
function getContrastingTextColor(backgroundColor) {
  const color = backgroundColor.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

module.exports = {
  getColorByType,
  getChartColors,
  getGradientColors,
  generateRandomColor,
  adjustBrightness,
  addTransparency,
  getSemanticColor,
  createCanvasGradient,
  getContrastingTextColor,
};
