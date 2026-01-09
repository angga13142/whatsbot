/**
 * Validator Unit Tests
 */

const {
  validatePhoneNumber,
  validateAmount,
  validateTransactionType,
  validateRole,
  sanitizeInput,
  validateTransactionData,
  validateUserData,
  validateDateRange,
} = require('../../../src/utils/validator');

describe('Validator Utils', () => {
  describe('validatePhoneNumber', () => {
    test('validates correct Indonesian number starting with 08', () => {
      const result = validatePhoneNumber('08123456789');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('628123456789');
    });

    test('validates number starting with 628', () => {
      const result = validatePhoneNumber('628123456789');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('628123456789');
    });

    test('validates number starting with +62', () => {
      const result = validatePhoneNumber('+628123456789');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('628123456789');
    });

    test('rejects too short number', () => {
      const result = validatePhoneNumber('123');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('rejects non-numeric input', () => {
      const result = validatePhoneNumber('abc');
      expect(result.valid).toBe(false);
    });

    test('rejects empty string', () => {
      const result = validatePhoneNumber('');
      expect(result.valid).toBe(false);
    });

    test('handles number with spaces', () => {
      const result = validatePhoneNumber('0812 3456 789');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('628123456789');
    });
  });

  describe('validateAmount', () => {
    test('validates positive number', () => {
      const result = validateAmount(1000000);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(1000000);
    });

    test('validates string number', () => {
      const result = validateAmount('500000');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(500000);
    });

    test('rejects zero', () => {
      const result = validateAmount(0);
      expect(result.valid).toBe(false);
    });

    test('rejects negative number', () => {
      const result = validateAmount(-100);
      expect(result.valid).toBe(false);
    });

    test('rejects non-numeric string', () => {
      const result = validateAmount('abc');
      expect(result.valid).toBe(false);
    });

    test('rejects null', () => {
      const result = validateAmount(null);
      expect(result.valid).toBe(false);
    });

    test('rejects very large amount', () => {
      const result = validateAmount(100000000000); // Very large
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTransactionType', () => {
    test('validates paket', () => {
      const result = validateTransactionType('paket');
      expect(result.valid).toBe(true);
    });

    test('validates utang', () => {
      const result = validateTransactionType('utang');
      expect(result.valid).toBe(true);
    });

    test('validates jajan', () => {
      const result = validateTransactionType('jajan');
      expect(result.valid).toBe(true);
    });

    test('rejects invalid type', () => {
      const result = validateTransactionType('invalid');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateRole', () => {
    const validRoles = ['superadmin', 'admin', 'karyawan', 'investor'];

    validRoles.forEach((role) => {
      test(`validates ${role}`, () => {
        const result = validateRole(role);
        expect(result.valid).toBe(true);
      });
    });

    test('rejects invalid role', () => {
      const result = validateRole('invalid');
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('trims whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    test('escapes HTML entities', () => {
      const result = sanitizeInput('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
    });

    test('handles normal text', () => {
      expect(sanitizeInput('Normal text')).toBe('Normal text');
    });
  });

  describe('validateTransactionData', () => {
    test('validates valid transaction data', () => {
      const data = {
        type: 'paket',
        amount: 100000,
        description: 'Test transaction',
      };
      const result = validateTransactionData(data);
      expect(result.valid).toBe(true);
    });

    test('requires customer_name for utang', () => {
      const data = {
        type: 'utang',
        amount: 100000,
        description: 'Test utang',
      };
      const result = validateTransactionData(data);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('customer_name');
    });
  });

  describe('validateUserData', () => {
    test('validates valid user data', () => {
      const data = {
        phone_number: '628123456789',
        full_name: 'Test User',
        role: 'karyawan',
      };
      const result = validateUserData(data);
      expect(result.valid).toBe(true);
    });

    test('validates invalid phone pattern', () => {
      const data = {
        phone_number: '123',
        full_name: 'Test User',
        role: 'karyawan',
      };
      const result = validateUserData(data);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    test('validates valid range', () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-31');
      const result = validateDateRange(start, end);
      expect(result.valid).toBe(true);
    });

    test('rejects start > end', () => {
      const start = new Date('2026-02-01');
      const end = new Date('2026-01-31');
      const result = validateDateRange(start, end);
      expect(result.valid).toBe(false);
    });
  });
});
