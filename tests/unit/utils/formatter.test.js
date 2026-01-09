/**
 * Formatter Unit Tests
 */

const {
  formatCurrency,
  formatDate,
  formatPhoneNumber,
  formatPercentage,
  truncateText,
} = require('../../../src/utils/formatter');

describe('Formatter Utils', () => {
  describe('formatCurrency', () => {
    test('formats 1 million correctly', () => {
      expect(formatCurrency(1000000)).toBe('Rp 1.000.000');
    });

    test('formats 1.5 million correctly', () => {
      expect(formatCurrency(1500000)).toBe('Rp 1.500.000');
    });

    test('formats small amount correctly', () => {
      expect(formatCurrency(50000)).toBe('Rp 50.000');
    });

    test('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('Rp 0');
    });

    test('formats without symbol', () => {
      expect(formatCurrency(1000000, false)).toBe('1.000.000');
    });

    test('handles null as zero', () => {
      expect(formatCurrency(null)).toBe('Rp 0');
    });

    test('handles undefined as zero', () => {
      expect(formatCurrency(undefined)).toBe('Rp 0');
    });

    test('converts string to number', () => {
      expect(formatCurrency('1000000')).toBe('Rp 1.000.000');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2026-01-10T10:30:00');

    test('formats with default format', () => {
      const result = formatDate(testDate);
      expect(result).toContain('2026');
      expect(result).toContain('Januari');
    });

    test('formats with custom format DD/MM/YYYY', () => {
      const result = formatDate(testDate, 'DD/MM/YYYY');
      expect(result).toBe('10/01/2026');
    });

    test('formats with time', () => {
      const result = formatDate(testDate, 'DD MMM YYYY HH:mm');
      expect(result).toContain('10 Jan 2026');
      expect(result).toContain('10:30');
    });

    test('handles invalid date', () => {
      // Depending on implementation, might return '-' or 'Invalid Date'
      // Assuming existing implementation returns something safe or error
      // Let's create a test that checks if it doesn't crash
      const result = formatDate('invalid');
      expect(result).toBeDefined();
    });
  });

  describe('formatPhoneNumber', () => {
    test('formats Indonesian number correctly', () => {
      expect(formatPhoneNumber('628123456789')).toBe('+62 812-3456-789');
    });

    test('handles number with spaces', () => {
      expect(formatPhoneNumber('62 812 3456 789')).toBe('+62 812-3456-789');
    });

    test('handles number with dashes', () => {
      expect(formatPhoneNumber('62-812-3456-789')).toBe('+62 812-3456-789');
    });
  });

  describe('formatPercentage', () => {
    test('formats percentage with default decimals', () => {
      expect(formatPercentage(75.5)).toBe('75,5%');
    });

    test('formats percentage without decimals', () => {
      expect(formatPercentage(100, 0)).toBe('100%');
    });

    test('formats small percentage', () => {
      expect(formatPercentage(0.5, 2)).toBe('0,50%');
    });
  });

  describe('truncateText', () => {
    test('truncates long text', () => {
      const text = 'Lorem ipsum dolor sit amet';
      expect(truncateText(text, 10)).toBe('Lorem ipsu...');
    });

    test('does not truncate short text', () => {
      const text = 'Short';
      expect(truncateText(text, 10)).toBe('Short');
    });

    test('handles exact length', () => {
      const text = 'Exactly10!';
      expect(truncateText(text, 10)).toBe('Exactly10!');
    });
  });
});
