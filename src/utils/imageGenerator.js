/**
 * Image Generator Utility
 *
 * Render charts to PNG images using chartjs-node-canvas
 */

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs').promises;
const path = require('path');
const chartConfig = require('../config/chartConfig');
const logger = require('./logger');

const CHARTS_DIR = process.env.CHARTS_STORAGE_PATH || './storage/charts';

// Canvas instances cache
const canvasCache = {};

/**
 * Get or create canvas instance for dimensions
 */
function getCanvas(width, height) {
  const key = `${width}x${height}`;
  if (!canvasCache[key]) {
    canvasCache[key] = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: chartConfig.export.backgroundColor,
    });
  }
  return canvasCache[key];
}

/**
 * Ensure charts directory exists
 */
async function ensureChartsDir() {
  await fs.mkdir(CHARTS_DIR, { recursive: true });
}

module.exports = {
  /**
   * Render chart to PNG buffer
   */
  async renderToBuffer(chartConfiguration, dimensions = 'default') {
    try {
      const dim = chartConfig.dimensions[dimensions] || chartConfig.dimensions.default;
      const canvas = getCanvas(dim.width, dim.height);

      const buffer = await canvas.renderToBuffer(chartConfiguration);
      return buffer;
    } catch (error) {
      logger.error('Error rendering chart to buffer', { error: error.message });
      throw error;
    }
  },

  /**
   * Render chart and save to file
   */
  async renderToFile(chartConfiguration, filename, dimensions = 'default') {
    try {
      await ensureChartsDir();

      const buffer = await this.renderToBuffer(chartConfiguration, dimensions);
      const filepath = path.join(CHARTS_DIR, `${filename}.png`);

      await fs.writeFile(filepath, buffer);

      logger.info('Chart rendered to file', { filepath });

      return {
        filename: `${filename}.png`,
        filepath,
        size: buffer.length,
      };
    } catch (error) {
      logger.error('Error rendering chart to file', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate unique filename
   */
  generateFilename(prefix = 'chart') {
    return `${prefix}-${Date.now()}`;
  },

  /**
   * Cleanup old chart files
   */
  async cleanupOldCharts(maxAgeMs = 24 * 60 * 60 * 1000) {
    try {
      await ensureChartsDir();
      const files = await fs.readdir(CHARTS_DIR);
      const now = Date.now();
      let deleted = 0;

      for (const file of files) {
        const filepath = path.join(CHARTS_DIR, file);
        const stats = await fs.stat(filepath);

        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.unlink(filepath);
          deleted++;
        }
      }

      logger.info('Cleaned up old charts', { deleted });
      return deleted;
    } catch (error) {
      logger.error('Error cleaning up charts', { error: error.message });
      return 0;
    }
  },

  /**
   * Get chart file path
   */
  getChartPath(filename) {
    return path.join(CHARTS_DIR, filename);
  },

  /**
   * Check if chart file exists
   */
  async chartExists(filename) {
    try {
      await fs.access(path.join(CHARTS_DIR, filename));
      return true;
    } catch {
      return false;
    }
  },

  CHARTS_DIR,
};
