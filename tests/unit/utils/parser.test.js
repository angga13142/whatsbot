/**
 * Parser Unit Tests (NLP)
 */

const {
  parseNaturalAmount,
  normalizeAmount,
  extractNumbers,
  parseTransactionIntent,
  parseCustomerName,
} = require('../../../src/utils/parser');

describe('Parser Utils', () => {
  describe('parseNaturalAmount', () => {
    test('parses "250rb" correctly', () => {
      const result = parseNaturalAmount('250rb');
      expect(result.amount).toBe(250000);
    });

    test('parses "250 rb" with space', () => {
      const result = parseNaturalAmount('250 rb');
      expect(result.amount).toBe(250000);
    });

    test('parses "1.5jt" correctly', () => {
      const result = parseNaturalAmount('1.5jt');
      expect(result.amount).toBe(1500000);
    });

    test('parses "2jt" correctly', () => {
      const result = parseNaturalAmount('2jt');
      expect(result.amount).toBe(2000000);
    });

    test('parses "jual 5 paket @50rb"', () => {
      const result = parseNaturalAmount('jual 5 paket @50rb');
      expect(result.amount).toBe(250000);
      expect(result.details.quantity).toBe(5);
      expect(result.details.unitPrice).toBe(50000);
    });

    test('parses "jual 10 @100rb"', () => {
      const result = parseNaturalAmount('jual 10 @100rb');
      expect(result.amount).toBe(1000000);
      expect(result.details.quantity).toBe(10);
    });

    test('parses plain number', () => {
      const result = parseNaturalAmount('1500000');
      expect(result.amount).toBe(1500000);
    });

    test('parses "500 ribu"', () => {
      const result = parseNaturalAmount('500 ribu');
      expect(result.amount).toBe(500000);
    });

    test('parses "1 juta"', () => {
      const result = parseNaturalAmount('1 juta');
      expect(result.amount).toBe(1000000);
    });
  });

  describe('normalizeAmount', () => {
    test('normalizes "250.000" to 250000', () => {
      expect(normalizeAmount('250.000')).toBe(250000);
    });

    test('normalizes "250,000" to 250 (Indo decimal)', () => {
      // In Indo, comma is decimal. 250,000 is 250.
      expect(normalizeAmount('250,000')).toBe(250);
    });

    test('normalizes "250 000" to 250000', () => {
      expect(normalizeAmount('250 000')).toBe(250000);
    });

    test('converts rb to thousands', () => {
      expect(normalizeAmount('250rb')).toBe(250000);
    });

    test('converts jt to millions', () => {
      expect(normalizeAmount('2.5jt')).toBe(2500000);
    });
  });

  describe('extractNumbers', () => {
    test('extracts single number', () => {
      const result = extractNumbers('Amount is 500000');
      expect(result).toContain(500000);
    });

    test('extracts multiple numbers', () => {
      const result = extractNumbers('jual 5 paket @50rb');
      expect(result.length).toBeGreaterThan(0);
    });

    test('handles text without numbers', () => {
      const result = extractNumbers('no numbers here');
      expect(result).toEqual([]);
    });
  });

  describe('parseTransactionIntent', () => {
    test('detects paket intent', () => {
      expect(parseTransactionIntent('jual paket')).toBe('paket');
      expect(parseTransactionIntent('penjualan hari ini')).toBe('paket');
    });

    test('detects utang intent', () => {
      expect(parseTransactionIntent('catat utang')).toBe('utang');
      expect(parseTransactionIntent('piutang baru')).toBe('utang');
    });

    test('detects jajan intent', () => {
      expect(parseTransactionIntent('beli bensin')).toBe('jajan');
      expect(parseTransactionIntent('pengeluaran operasional')).toBe('jajan');
    });

    test('returns null for unknown', () => {
      expect(parseTransactionIntent('halo apa kabar')).toBeNull();
    });
  });

  describe('parseCustomerName', () => {
    test('extracts name from utang text', () => {
      expect(parseCustomerName('utang Budi 50rb')).toBe('Budi');
      expect(parseCustomerName('utang Siti')).toBe('Siti');
    });

    test('extracts name with spaces', () => {
      expect(parseCustomerName('utang Pak Ahmad 100rb')).toBe('Pak Ahmad');
    });
  });
});
