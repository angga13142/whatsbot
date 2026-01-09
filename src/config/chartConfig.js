/**
 * Chart Configuration
 *
 * Default configurations for all chart types
 */

module.exports = {
  // Default chart dimensions
  dimensions: {
    dashboard: {
      width: 1080,
      height: 1920, // Portrait for mobile
    },
    fullChart: {
      width: 1200,
      height: 800,
    },
    squareChart: {
      width: 1000,
      height: 1000,
    },
    wideChart: {
      width: 1400,
      height: 600,
    },
    miniChart: {
      width: 400,
      height: 200,
    },
  },

  // Color palettes
  colors: {
    primary: {
      income: '#10B981', // Green
      expense: '#EF4444', // Red
      net: '#3B82F6', // Blue
      neutral: '#6B7280', // Gray
    },
    chart: [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F97316', // Orange
      '#6366F1', // Indigo
    ],
    gradient: {
      income: ['#10B981', '#059669'],
      expense: ['#EF4444', '#DC2626'],
      neutral: ['#6B7280', '#4B5563'],
    },
    background: {
      light: '#FFFFFF',
      dark: '#1F2937',
      card: '#F9FAFB',
    },
  },

  // Font settings
  fonts: {
    family: 'Arial, sans-serif',
    sizes: {
      title: 24,
      subtitle: 18,
      label: 14,
      value: 16,
      legend: 12,
    },
    weights: {
      normal: 'normal',
      bold: 'bold',
    },
  },

  // Default chart options
  defaults: {
    bar: {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          displayColors: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            callback: function (value) {
              return 'Rp ' + value.toLocaleString('id-ID');
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },

    line: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
      elements: {
        line: {
          tension: 0.4, // Smooth curves
          borderWidth: 3,
        },
        point: {
          radius: 4,
          hoverRadius: 6,
        },
      },
    },

    pie: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            padding: 15,
            font: {
              size: 14,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}:  Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
            },
          },
        },
      },
    },

    doughnut: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          display: true,
          position: 'right',
        },
      },
    },
  },

  // Image export settings
  export: {
    format: 'png',
    quality: 0.95,
    backgroundColor: '#FFFFFF',
    maxFileSize: 2 * 1024 * 1024, // 2MB for WhatsApp
    compression: {
      enabled: true,
      quality: 85,
    },
  },

  // Dashboard layout
  dashboard: {
    padding: 40,
    spacing: 20,
    cardHeight: 150,
    chartHeight: 400,
    backgroundColor: '#F3F4F6',
    titleHeight: 80,
    footerHeight: 60,
  },

  // Branding
  branding: {
    enabled: true,
    logo: {
      path: './assets/logo.png', // Optional
      width: 60,
      height: 60,
      position: 'top-right',
    },
    watermark: {
      text: 'Cashflow Bot',
      enabled: true,
      position: 'bottom-right',
      opacity: 0.3,
    },
  },
};
