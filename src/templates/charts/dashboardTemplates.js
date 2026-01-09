/**
 * Dashboard Templates
 *
 * Predefined dashboard layouts
 */

module.exports = {
  /**
   * Standard dashboard template
   */
  standard: {
    layout: 'vertical',
    sections: [
      { type: 'metrics', height: 150 },
      { type: 'trend_chart', height: 400 },
      { type: 'category_chart', height: 400 },
    ],
  },

  /**
   * Executive dashboard template
   */
  executive: {
    layout: 'grid',
    sections: [
      { type: 'kpi_cards', height: 120 },
      { type: 'comparison_chart', height: 350 },
      { type: 'top_performers', height: 300 },
    ],
  },

  /**
   * Quick view template
   */
  quick: {
    layout: 'compact',
    sections: [{ type: 'metrics', height: 150 }],
  },
};
