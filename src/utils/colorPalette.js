/**
 * Color Palette Utility
 *
 * Color schemes and themes for charts
 */

const PALETTES = {
  // Main palette for income/expense
  primary: {
    income: '#22c55e', // Green
    expense: '#ef4444', // Red
    net: '#3b82f6', // Blue
    neutral: '#6b7280', // Gray
  },

  // Category colors (12 distinct colors)
  categories: [
    '#3b82f6', // Blue
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#ec4899', // Pink
    '#84cc16', // Lime
    '#14b8a6', // Teal
    '#6366f1', // Indigo
    '#a855f7', // Violet
  ],

  // Gradient pairs for backgrounds
  gradients: {
    blue: ['#3b82f6', '#1d4ed8'],
    green: ['#22c55e', '#16a34a'],
    red: ['#ef4444', '#dc2626'],
    purple: ['#8b5cf6', '#7c3aed'],
    orange: ['#f97316', '#ea580c'],
  },

  // Dark theme
  dark: {
    background: '#1f2937',
    text: '#f9fafb',
    grid: 'rgba(255, 255, 255, 0.1)',
    border: '#374151',
  },

  // Light theme
  light: {
    background: '#ffffff',
    text: '#111827',
    grid: 'rgba(0, 0, 0, 0.1)',
    border: '#e5e7eb',
  },
};

module.exports = {
  /**
   * Get primary colors
   */
  getPrimary() {
    return PALETTES.primary;
  },

  /**
   * Get category color by index
   */
  getCategoryColor(index) {
    return PALETTES.categories[index % PALETTES.categories.length];
  },

  /**
   * Get array of category colors
   */
  getCategoryColors(count = 12) {
    return PALETTES.categories.slice(0, count);
  },

  /**
   * Get gradient colors
   */
  getGradient(name) {
    return PALETTES.gradients[name] || PALETTES.gradients.blue;
  },

  /**
   * Get theme colors
   */
  getTheme(theme = 'light') {
    return PALETTES[theme] || PALETTES.light;
  },

  /**
   * Create transparent version of color
   */
  withAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Get colors for income/expense chart
   */
  getIncomeExpenseColors() {
    return {
      income: PALETTES.primary.income,
      incomeLight: this.withAlpha(PALETTES.primary.income, 0.2),
      expense: PALETTES.primary.expense,
      expenseLight: this.withAlpha(PALETTES.primary.expense, 0.2),
      net: PALETTES.primary.net,
      netLight: this.withAlpha(PALETTES.primary.net, 0.2),
    };
  },

  /**
   * Get colors for trend chart
   */
  getTrendColors() {
    return {
      positive: PALETTES.primary.income,
      negative: PALETTES.primary.expense,
      neutral: PALETTES.primary.neutral,
      line: PALETTES.primary.net,
      fill: this.withAlpha(PALETTES.primary.blue, 0.1),
    };
  },

  /**
   * Generate color scale (for heat maps)
   */
  getColorScale(value, min = 0, max = 100) {
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

    if (ratio < 0.5) {
      // Red to Yellow
      const r = 239;
      const g = Math.round(68 + ratio * 2 * (234 - 68));
      const b = 68;
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to Green
      const r = Math.round(234 - (ratio - 0.5) * 2 * (234 - 34));
      const g = Math.round(197 + (ratio - 0.5) * 2 * (197 - 197));
      const b = 34;
      return `rgb(${r}, ${g}, ${b})`;
    }
  },

  PALETTES,
};
