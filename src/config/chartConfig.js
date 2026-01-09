/**
 * Chart Configuration
 *
 * Default configurations for chart generation
 */

module.exports = {
  // Canvas dimensions
  dimensions: {
    default: { width: 800, height: 600 },
    square: { width: 600, height: 600 },
    wide: { width: 1000, height: 500 },
    tall: { width: 600, height: 800 },
    whatsapp: { width: 800, height: 800 },
    dashboard: { width: 1200, height: 800 },
  },

  // Font settings
  fonts: {
    family: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
    titleSize: 20,
    labelSize: 14,
    legendSize: 12,
    tickSize: 11,
  },

  // Chart type defaults
  chartDefaults: {
    bar: {
      borderRadius: 6,
      borderWidth: 0,
      categoryPercentage: 0.7,
      barPercentage: 0.8,
    },
    line: {
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
    },
    pie: {
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 10,
    },
    doughnut: {
      cutout: '60%',
      borderWidth: 2,
      borderColor: '#ffffff',
    },
  },

  // Animation (disabled for server-side)
  animation: false,

  // Legend position
  legend: {
    position: 'bottom',
    align: 'center',
  },

  // Tooltip settings
  tooltip: {
    enabled: true,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    titleColor: '#ffffff',
    bodyColor: '#ffffff',
    cornerRadius: 6,
    padding: 12,
  },

  // Grid settings
  grid: {
    display: true,
    color: 'rgba(0, 0, 0, 0.1)',
    drawBorder: false,
  },

  // Export settings
  export: {
    format: 'png',
    quality: 0.95,
    backgroundColor: '#ffffff',
  },

  // WhatsApp optimization
  whatsapp: {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    compression: 0.85,
    minWidth: 400,
    maxWidth: 1200,
  },
};
