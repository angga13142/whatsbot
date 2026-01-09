/**
 * Image Generator Utility
 *
 * Generate images from charts and dashboards
 */

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const chartConfig = require('../config/chartConfig');
const logger = require('./logger');

class ImageGenerator {
  constructor() {
    this.outputPath = process.env.CHART_OUTPUT_PATH || './storage/charts';
    this._ensureOutputDirectory();
  }

  /**
   * Ensure output directory exists
   * @private
   */
  async _ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputPath, { recursive: true });
    } catch (error) {
      logger.error('Error creating chart output directory', { error: error.message });
    }
  }

  /**
   * Generate chart image
   * @param {Object} chartConfig - Chart. js configuration
   * @param {Object} options - Image options
   * @returns {Promise<string>} File path
   */
  async generateChartImage(chartJson, options = {}) {
    try {
      const width = options.width || chartConfig.dimensions.fullChart.width;
      const height = options.height || chartConfig.dimensions.fullChart.height;

      // Create Chart.js canvas renderer
      const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width,
        height,
        backgroundColour: options.backgroundColor || '#FFFFFF',
      });

      // Render chart to buffer
      const buffer = await chartJSNodeCanvas.renderToBuffer(chartJson);

      // Optimize image
      const optimized = await sharp(buffer)
        .png({ quality: chartConfig.export.compression.quality })
        .toBuffer();

      // Save file
      const filename = `chart-${Date.now()}.png`;
      const filePath = path.join(this.outputPath, filename);
      await fs.writeFile(filePath, optimized);

      logger.info('Chart image generated', { filePath, size: optimized.length });

      return filePath;
    } catch (error) {
      logger.error('Error generating chart image', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate dashboard image
   * @param {Object} dashboardData - Dashboard data
   * @param {Object} options - Options
   * @returns {Promise<string>} File path
   */
  async generateDashboardImage(
    dashboardData,
    // eslint-disable-line no-unused-vars
    options = {} // eslint-disable-line no-unused-vars
  ) {
    try {
      const { width, height } = chartConfig.dimensions.dashboard;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Draw background
      ctx.fillStyle = chartConfig.dashboard.backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const padding = chartConfig.dashboard.padding;
      let yOffset = padding;

      // Draw title
      yOffset = await this._drawTitle(ctx, dashboardData.title, width, yOffset);

      // Draw metric cards
      yOffset = await this._drawMetricCards(ctx, dashboardData.metrics, width, yOffset);

      // Draw charts
      if (dashboardData.charts && dashboardData.charts.length > 0) {
        // eslint-disable-next-line no-unused-vars
        // eslint-disable-next-line no-unused-vars
        yOffset = await this._drawCharts(ctx, dashboardData.charts, width, yOffset);
      }

      // Draw footer
      await this._drawFooter(ctx, width, height, dashboardData.timestamp);

      // Add watermark if enabled
      if (chartConfig.branding.watermark.enabled) {
        this._drawWatermark(ctx, width, height);
      }

      // Convert to buffer
      const buffer = canvas.toBuffer('image/png');

      // Optimize
      const optimized = await sharp(buffer).png({ quality: 90 }).toBuffer();

      // Save file
      const filename = `dashboard-${Date.now()}.png`;
      const filePath = path.join(this.outputPath, filename);
      await fs.writeFile(filePath, optimized);

      logger.info('Dashboard image generated', { filePath });

      return filePath;
    } catch (error) {
      logger.error('Error generating dashboard image', { error: error.message });
      throw error;
    }
  }

  /**
   * Draw title section
   * @private
   */
  async _drawTitle(ctx, title, width, yOffset) {
    const titleHeight = chartConfig.dashboard.titleHeight;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, yOffset, width, titleHeight);

    // Title text
    ctx.fillStyle = '#1F2937';
    ctx.font = `bold ${chartConfig.fonts.sizes.title}px ${chartConfig.fonts.family}`;
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, yOffset + titleHeight / 2 + 8);

    return yOffset + titleHeight + chartConfig.dashboard.spacing;
  }

  /**
   * Draw metric cards
   * @private
   */
  async _drawMetricCards(ctx, metrics, width, yOffset) {
    if (!metrics || metrics.length === 0) return yOffset;

    const padding = chartConfig.dashboard.padding;
    const spacing = chartConfig.dashboard.spacing;
    const cardHeight = chartConfig.dashboard.cardHeight;
    const cardWidth = (width - padding * 2 - spacing * (metrics.length - 1)) / metrics.length;

    metrics.forEach((metric, index) => {
      const x = padding + (cardWidth + spacing) * index;
      const y = yOffset;

      // Card background
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      this._drawRoundedRect(ctx, x, y, cardWidth, cardHeight, 12);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Icon
      ctx.font = `${40}px Arial`;
      ctx.fillText(metric.icon, x + 20, y + 50);

      // Label
      ctx.fillStyle = '#6B7280';
      ctx.font = `${chartConfig.fonts.sizes.label}px ${chartConfig.fonts.family}`;
      ctx.textAlign = 'left';
      ctx.fillText(metric.label, x + 80, y + 35);

      // Value
      ctx.fillStyle = '#1F2937';
      ctx.font = `bold ${chartConfig.fonts.sizes.value + 4}px ${chartConfig.fonts.family}`;
      ctx.fillText(metric.value, x + 80, y + 65);

      // Change indicator
      if (metric.change) {
        const changeColor = metric.change >= 0 ? '#10B981' : '#EF4444';
        const changeIcon = metric.change >= 0 ? '↑' : '↓';

        ctx.fillStyle = changeColor;
        ctx.font = `${chartConfig.fonts.sizes.label}px ${chartConfig.fonts.family}`;
        ctx.fillText(`${changeIcon} ${Math.abs(metric.change)}%`, x + 80, y + 90);
      }
    });

    return yOffset + cardHeight + spacing * 2;
  }

  /**
   * Draw charts section
   * @private
   */
  async _drawCharts(ctx, charts, width, yOffset) {
    const padding = chartConfig.dashboard.padding;
    const spacing = chartConfig.dashboard.spacing;

    for (const chart of charts) {
      const chartHeight = chart.height || chartConfig.dashboard.chartHeight;

      // Draw chart background
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      this._drawRoundedRect(ctx, padding, yOffset, width - padding * 2, chartHeight, 12);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Generate chart as separate image and draw it
      if (chart.config) {
        const chartImage = await this._generateChartForDashboard(chart.config, {
          width: width - padding * 2 - 40,
          height: chartHeight - 40,
        });

        const img = await loadImage(chartImage);
        ctx.drawImage(img, padding + 20, yOffset + 20);

        // Clean up temp chart file
        await fs.unlink(chartImage).catch(() => {});
      }

      yOffset += chartHeight + spacing;
    }

    return yOffset;
  }

  /**
   * Draw footer
   * @private
   */
  async _drawFooter(ctx, width, height, timestamp) {
    const footerHeight = chartConfig.dashboard.footerHeight;
    const y = height - footerHeight;

    // Footer text
    ctx.fillStyle = '#6B7280';
    ctx.font = `${chartConfig.fonts.sizes.label}px ${chartConfig.fonts.family}`;
    ctx.textAlign = 'center';

    const dateStr = timestamp
      ? new Date(timestamp).toLocaleString('id-ID')
      : new Date().toLocaleString('id-ID');
    ctx.fillText(`Generated:  ${dateStr}`, width / 2, y + footerHeight / 2);
  }

  /**
   * Draw watermark
   * @private
   */
  _drawWatermark(ctx, width, height) {
    const text = chartConfig.branding.watermark.text;
    const opacity = chartConfig.branding.watermark.opacity;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#6B7280';
    ctx.font = `${chartConfig.fonts.sizes.label}px ${chartConfig.fonts.family}`;
    ctx.textAlign = 'right';
    ctx.fillText(text, width - 20, height - 20);
    ctx.restore();
  }

  /**
   * Draw rounded rectangle
   * @private
   */
  _drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Generate chart for dashboard
   * @private
   */
  async _generateChartForDashboard(chartConfig, dimensions) {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: dimensions.width,
      height: dimensions.height,
      backgroundColour: 'transparent',
    });

    const buffer = await chartJSNodeCanvas.renderToBuffer(chartConfig);
    const filename = `temp-chart-${Date.now()}.png`;
    const filePath = path.join(this.outputPath, filename);
    await fs.writeFile(filePath, buffer);

    return filePath;
  }

  /**
   * Optimize image for WhatsApp
   * @param {string} inputPath - Input image path
   * @param {Object} options - Optimization options
   * @returns {Promise<string>} Optimized image path
   */
  async optimizeForWhatsApp(inputPath, options = {}) {
    try {
      const maxSize = options.maxSize || chartConfig.export.maxFileSize;
      const quality = options.quality || 85;

      let optimized = await sharp(inputPath)
        .resize(1200, null, {
          // Max width 1200px
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toBuffer();

      // Check file size and reduce quality if needed
      if (optimized.length > maxSize) {
        let currentQuality = quality - 10;
        while (optimized.length > maxSize && currentQuality > 50) {
          optimized = await sharp(inputPath)
            .resize(1200, null, { fit: 'inside' })
            .jpeg({ quality: currentQuality })
            .toBuffer();
          currentQuality -= 10;
        }
      }

      const outputPath = inputPath.replace('.png', '-optimized.jpg');
      await fs.writeFile(outputPath, optimized);

      logger.info('Image optimized for WhatsApp', {
        originalSize: (await fs.stat(inputPath)).size,
        optimizedSize: optimized.length,
      });

      return outputPath;
    } catch (error) {
      logger.error('Error optimizing image', { error: error.message });
      throw error;
    }
  }

  /**
   * Clean old chart files
   * @param {number} daysOld - Delete files older than X days
   * @returns {Promise<number>}
   */
  async cleanOldCharts(daysOld = 1) {
    try {
      const files = await fs.readdir(this.outputPath);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.outputPath, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      logger.info('Old chart files cleaned', { deletedCount });

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning old charts', { error: error.message });
      return 0;
    }
  }
}

module.exports = new ImageGenerator();
