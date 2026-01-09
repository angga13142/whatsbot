/**
 * Transaction Flow Integration Tests
 *
 * Tests complete transaction workflows
 */

const transactionService = require('../../src/services/transactionService');
// // const userService = require('../../src/services/userService');
const userRepository = require('../../src/database/repositories/userRepository');
// // const transactionRepository = require('../../src/database/repositories/transactionRepository');
const auditRepository = require('../../src/database/repositories/auditRepository');
const knex = require('../../src/database/connection');
const { generateUserData, cleanTestData } = require('../helpers/testHelpers');
const { setupTestDatabase } = require('../helpers/dbHelpers');
const dayjs = require('dayjs');

describe('Transaction Flow Integration Tests', () => {
  let karyawanId;
  let adminId;

  beforeAll(async () => {
    await setupTestDatabase(knex);
    await cleanTestData(knex);

    // Create admin user
    const adminData = generateUserData('admin');
    const admin = await userRepository.create(adminData);
    adminId = admin.id;

    // Create karyawan user
    const karyawanData = generateUserData('karyawan');
    const karyawan = await userRepository.create(karyawanData);
    karyawanId = karyawan.id;
  });

  afterAll(async () => {
    await cleanTestData(knex);
    await knex.destroy();
  });

  describe('Transaction Creation Flow', () => {
    test('creates transaction below threshold (auto-approved)', async () => {
      const transaction = await transactionService.createTransaction(
        karyawanId,
        'paket',
        500000, // Below 1M threshold
        'Penjualan auto-approve',
        {}
      );

      expect(transaction).toBeDefined();
      expect(transaction.transaction_id).toMatch(/^TRX-\d{8}-[A-F0-9]{8}$/);
      expect(transaction.status).toBe('approved'); // Auto-approved
      expect(transaction.approved_by).toBe(karyawanId);
      expect(transaction.approved_at).toBeDefined();

      // Verify audit log
      const logs = await auditRepository.findByUser(karyawanId, 10);
      const createLog = logs.find((log) => log.action === 'create_transaction');
      expect(createLog).toBeDefined();
    });

    test('creates transaction above threshold (pending)', async () => {
      const transaction = await transactionService.createTransaction(
        karyawanId,
        'paket',
        2000000, // Above 1M threshold
        'Penjualan perlu approval',
        {}
      );

      expect(transaction).toBeDefined();
      expect(transaction.status).toBe('pending'); // Needs approval
      expect(transaction.approved_by).toBeNull();
      expect(transaction.approved_at).toBeNull();
    });

    test('generates unique transaction IDs with hex suffix', async () => {
      const trx1 = await transactionService.createTransaction(
        karyawanId,
        'paket',
        100000,
        'Transaction 1',
        {}
      );

      const trx2 = await transactionService.createTransaction(
        karyawanId,
        'paket',
        100000,
        'Transaction 2',
        {}
      );

      // IDs should have different hex suffixes (since they're random)
      const hex1 = trx1.transaction_id.split('-')[2];
      const hex2 = trx2.transaction_id.split('-')[2];

      expect(hex1).not.toBe(hex2);
      expect(hex1).toMatch(/^[A-F0-9]{8}$/);
      expect(hex2).toMatch(/^[A-F0-9]{8}$/);
    });

    test('creates utang transaction with customer name', async () => {
      const transaction = await transactionService.createTransaction(
        karyawanId,
        'utang',
        1500000,
        'Utang Pak Budi',
        { customer_name: 'Pak Budi' }
      );

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('utang');
      expect(transaction.customer_name).toBe('Pak Budi');
    });

    test('validates transaction data', async () => {
      await expect(
        transactionService.createTransaction(
          karyawanId,
          'invalid_type', // Invalid type
          100000,
          'Invalid',
          {}
        )
      ).rejects.toThrow();
    });

    test('prevents negative amounts', async () => {
      await expect(
        transactionService.createTransaction(
          karyawanId,
          'paket',
          -100000, // Negative
          'Negative amount',
          {}
        )
      ).rejects.toThrow();
    });
  });

  describe('Transaction Approval Flow', () => {
    let pendingTransactionId;

    beforeAll(async () => {
      // Create pending transaction
      const transaction = await transactionService.createTransaction(
        karyawanId,
        'paket',
        2000000,
        'Pending transaction for approval test',
        {}
      );
      pendingTransactionId = transaction.transaction_id;
    });

    test('admin approves pending transaction', async () => {
      const approved = await transactionService.approveTransaction(pendingTransactionId, adminId);

      expect(approved.status).toBe('approved');
      expect(approved.approved_by).toBe(adminId);
      expect(approved.approved_at).toBeDefined();

      // Verify audit log
      const logs = await auditRepository.findByUser(adminId, 10);
      const approveLog = logs.find((log) => log.action === 'approve_transaction');
      expect(approveLog).toBeDefined();
    });

    test('prevents approving already approved transaction', async () => {
      await expect(
        transactionService.approveTransaction(pendingTransactionId, adminId)
      ).rejects.toThrow('sudah approved');
    });

    test('prevents non-admin from approving', async () => {
      const pending = await transactionService.createTransaction(
        karyawanId,
        'paket',
        2000000,
        'Another pending',
        {}
      );

      await expect(
        transactionService.approveTransaction(pending.transaction_id, karyawanId)
      ).rejects.toThrow('admin');
    });
  });

  describe('Transaction Rejection Flow', () => {
    let pendingTransactionId;

    beforeAll(async () => {
      const transaction = await transactionService.createTransaction(
        karyawanId,
        'paket',
        2000000,
        'Transaction to reject',
        {}
      );
      pendingTransactionId = transaction.transaction_id;
    });

    test('admin rejects pending transaction', async () => {
      const rejected = await transactionService.rejectTransaction(
        pendingTransactionId,
        adminId,
        'Jumlah tidak sesuai'
      );

      expect(rejected.status).toBe('rejected');

      // Verify audit log with reason
      const logs = await auditRepository.findByUser(adminId, 10);
      const rejectLog = logs.find((log) => log.action === 'reject_transaction');
      expect(rejectLog).toBeDefined();
      expect(rejectLog.details.reason).toBe('Jumlah tidak sesuai');
    });
  });

  describe('Transaction Query Flow', () => {
    beforeAll(async () => {
      // Create multiple transactions for testing
      await transactionService.createTransaction(karyawanId, 'paket', 300000, 'Query test 1', {});
      await transactionService.createTransaction(karyawanId, 'jajan', 150000, 'Query test 2', {});
      await transactionService.createTransaction(karyawanId, 'utang', 500000, 'Query test 3', {
        customer_name: 'Test',
      });
    });

    test('gets user transactions', async () => {
      const transactions = await transactionService.getUserTransactions(karyawanId);

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
      transactions.forEach((trx) => {
        expect(trx.user_id).toBe(karyawanId);
      });
    });

    test('filters transactions by type', async () => {
      const paketTransactions = await transactionService.getUserTransactions(karyawanId, {
        type: 'paket',
      });

      expect(Array.isArray(paketTransactions)).toBe(true);
      paketTransactions.forEach((trx) => {
        expect(trx.type).toBe('paket');
      });
    });

    test('filters transactions by date range', async () => {
      const today = dayjs().startOf('day').toDate();
      const tomorrow = dayjs().endOf('day').toDate();

      const todayTransactions = await transactionService.getUserTransactions(karyawanId, {
        startDate: today,
        endDate: tomorrow,
      });

      expect(Array.isArray(todayTransactions)).toBe(true);
    });

    test('gets pending transactions', async () => {
      // Create pending transaction
      await transactionService.createTransaction(
        karyawanId,
        'paket',
        2500000,
        'Pending for query test',
        {}
      );

      const pending = await transactionService.getPendingTransactions();

      expect(Array.isArray(pending)).toBe(true);
      pending.forEach((trx) => {
        expect(trx.status).toBe('pending');
      });
    });
  });

  describe('Transaction Summary Flow', () => {
    test('calculates user summary', async () => {
      const summary = await transactionService.calculateUserSummary(karyawanId);

      expect(summary).toBeDefined();
      expect(summary.user_id).toBe(karyawanId);
      expect(summary.total_transactions).toBeGreaterThan(0);
      expect(summary.by_type).toBeDefined();
      expect(summary.by_type.paket).toBeDefined();
      expect(typeof summary.total_amount).toBe('number');
    });

    test('calculates daily summary', async () => {
      const summary = await transactionService.calculateDailySummary();

      expect(summary).toBeDefined();
      expect(summary.total_transactions).toBeDefined();
      expect(summary.income).toBeDefined();
      expect(summary.expense).toBeDefined();
      expect(summary.net).toBeDefined();
      expect(summary.by_type).toBeDefined();
    });

    test('daily summary calculations are correct', async () => {
      const summary = await transactionService.calculateDailySummary();

      // Verify net calculation
      const expectedNet = summary.income - summary.expense;
      expect(summary.net).toBe(expectedNet);

      // Verify type totals sum correctly
      const typeTotal = summary.by_type.paket + summary.by_type.utang + summary.by_type.jajan;

      expect(typeTotal).toBeGreaterThan(0);
    });
  });

  describe('Transaction ID Generation', () => {
    test('generates valid format', async () => {
      const transaction = await transactionService.createTransaction(
        karyawanId,
        'paket',
        100000,
        'ID format test',
        {}
      );

      const idPattern = /^TRX-\d{8}-[A-F0-9]{8}$/;
      expect(transaction.transaction_id).toMatch(idPattern);

      // Verify date in ID matches today
      const dateInId = transaction.transaction_id.split('-')[1];
      const today = dayjs().format('YYYYMMDD');
      expect(dateInId).toBe(today);
    });

    test('handles multiple transactions same day', async () => {
      const transactions = await Promise.all([
        transactionService.createTransaction(karyawanId, 'paket', 100000, 'Concurrent 1', {}),
        transactionService.createTransaction(karyawanId, 'paket', 100000, 'Concurrent 2', {}),
        transactionService.createTransaction(karyawanId, 'paket', 100000, 'Concurrent 3', {}),
      ]);

      // All should have unique IDs
      const ids = transactions.map((t) => t.transaction_id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
