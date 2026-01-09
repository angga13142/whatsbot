/**
 * Database Integration Tests
 *
 * Tests database layer with real database operations
 */

const knex = require('../../src/database/connection');
const userRepository = require('../../src/database/repositories/userRepository');
const transactionRepository = require('../../src/database/repositories/transactionRepository');
const auditRepository = require('../../src/database/repositories/auditRepository');
const {
  generateUserData,
  generateTransactionData,
  cleanTestData,
} = require('../helpers/testHelpers');
const { setupTestDatabase } = require('../helpers/dbHelpers');

describe('Database Integration Tests', () => {
  // Setup:  Clean database before all tests
  beforeAll(async () => {
    await setupTestDatabase(knex);
    await cleanTestData(knex);
  });

  // Cleanup: Clean database after all tests
  afterAll(async () => {
    await cleanTestData(knex);
    await knex.destroy();
  });

  describe('Database Connection', () => {
    test('connects to database successfully', async () => {
      const result = await knex.raw('SELECT 1 as result');
      expect(result).toBeDefined();
    });

    test('all tables exist', async () => {
      const tables = await knex.raw("SELECT name FROM sqlite_master WHERE type='table'");

      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain('users');
      expect(tableNames).toContain('transactions');
      expect(tableNames).toContain('audit_logs');
      expect(tableNames).toContain('bot_sessions');
      expect(tableNames).toContain('system_config');
    });
  });

  describe('User Repository CRUD Operations', () => {
    let testUserId;

    test('creates user successfully', async () => {
      const userData = generateUserData('karyawan');

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.phone_number).toBe(userData.phone_number);
      expect(user.full_name).toBe(userData.full_name);
      expect(user.role).toBe('karyawan');

      testUserId = user.id;
    });

    test('finds user by ID', async () => {
      const user = await userRepository.findById(testUserId);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
    });

    test('finds user by phone number', async () => {
      const originalUser = await userRepository.findById(testUserId);
      const user = await userRepository.findByPhone(originalUser.phone_number);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
    });

    test('updates user successfully', async () => {
      const updates = { full_name: 'Updated Name' };

      const updated = await userRepository.update(testUserId, updates);

      expect(updated.full_name).toBe('Updated Name');
    });

    test('finds users by role', async () => {
      const karyawans = await userRepository.findByRole('karyawan');

      expect(Array.isArray(karyawans)).toBe(true);
      expect(karyawans.length).toBeGreaterThan(0);
      expect(karyawans[0].role).toBe('karyawan');
    });

    test('suspends user', async () => {
      await userRepository.suspend(testUserId);

      const user = await userRepository.findById(testUserId);
      expect(user.status).toBe('suspended');
    });

    test('unsuspends user', async () => {
      await userRepository.unsuspend(testUserId);

      const user = await userRepository.findById(testUserId);
      expect(user.status).toBe('active');
    });

    test('deletes user (soft delete)', async () => {
      await userRepository.delete(testUserId);

      const user = await userRepository.findById(testUserId);
      expect(user.status).toBe('inactive');
    });
  });

  describe('Transaction Repository Operations', () => {
    let testUserId;
    let testTransactionId;

    beforeAll(async () => {
      // Create test user
      const userData = generateUserData('karyawan');
      const user = await userRepository.create(userData);
      testUserId = user.id;
    });

    test('creates transaction successfully', async () => {
      const transactionData = generateTransactionData(testUserId, 'paket');

      const transaction = await transactionRepository.create(transactionData);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.user_id).toBe(testUserId);
      expect(transaction.type).toBe('paket');
      expect(transaction.amount).toBe(transactionData.amount);

      testTransactionId = transaction.transaction_id;
    });

    test('finds transaction by transaction_id', async () => {
      const transaction = await transactionRepository.findByTransactionId(testTransactionId);

      expect(transaction).toBeDefined();
      expect(transaction.transaction_id).toBe(testTransactionId);
    });

    test('finds transactions by user', async () => {
      const transactions = await transactionRepository.findByUser(testUserId);

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].user_id).toBe(testUserId);
    });

    test('updates transaction status', async () => {
      const transaction = await transactionRepository.findByTransactionId(testTransactionId);

      const updated = await transactionRepository.updateStatus(
        transaction.id,
        'approved',
        testUserId
      );

      expect(updated.status).toBe('approved');
      expect(updated.approved_by).toBe(testUserId);
      expect(updated.approved_at).toBeDefined();
    });

    test('finds transactions by date range', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const transactions = await transactionRepository.findByDateRange(today, tomorrow);

      expect(Array.isArray(transactions)).toBe(true);
    });

    test('gets total by user', async () => {
      const dateRange = {
        startDate: new Date(),
        endDate: new Date(),
      };
      const totals = await transactionRepository.getTotalByUser(testUserId, dateRange);

      expect(totals).toBeDefined();
      expect(typeof totals.paket).toBe('number');
    });

    test('gets statistics', async () => {
      const dateRange = {
        startDate: new Date(),
        endDate: new Date(),
      };
      const stats = await transactionRepository.getStatistics(dateRange);

      expect(stats).toBeDefined();
      expect(stats.count).toBeGreaterThan(0);
    });
  });

  describe('Audit Repository Operations', () => {
    let testUserId;

    beforeAll(async () => {
      const userData = generateUserData('karyawan');
      const user = await userRepository.create(userData);
      testUserId = user.id;
    });

    test('logs activity successfully', async () => {
      const log = await auditRepository.log(testUserId, 'test_action', 'test_entity', 123, {
        test: 'data',
      });

      expect(log).toBeDefined();
      expect(log.id).toBeDefined();
    });

    test('finds logs by user', async () => {
      const logs = await auditRepository.findByUser(testUserId, 10);

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].user_id).toBe(testUserId);
    });

    test('finds logs by action', async () => {
      const logs = await auditRepository.findByAction('test_action', 10);

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });

    test('finds logs by date range', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const logs = await auditRepository.findByDateRange(yesterday, tomorrow);

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('Foreign Key Constraints', () => {
    let testUserId;

    beforeAll(async () => {
      const userData = generateUserData('karyawan');
      const user = await userRepository.create(userData);
      testUserId = user.id;
    });

    test('transaction references user correctly', async () => {
      const transactionData = generateTransactionData(testUserId, 'paket');
      const transaction = await transactionRepository.create(transactionData);

      // Verify foreign key relationship
      const result = await knex('transactions')
        .join('users', 'transactions.user_id', 'users.id')
        .where('transactions.id', transaction.id)
        .select('users.full_name', 'transactions.transaction_id')
        .first();

      expect(result).toBeDefined();
      expect(result.full_name).toBeDefined();
    });

    test('audit log references user correctly', async () => {
      await auditRepository.log(testUserId, 'fk_test', null, null, {});

      const result = await knex('audit_logs')
        .join('users', 'audit_logs.user_id', 'users.id')
        .where('audit_logs.action', 'fk_test')
        .select('users.full_name', 'audit_logs.action')
        .first();

      expect(result).toBeDefined();
      expect(result.full_name).toBeDefined();
    });
  });

  describe('Transaction Atomicity', () => {
    test('rolls back on error', async () => {
      const userData = generateUserData('karyawan');

      try {
        await knex.transaction(async (trx) => {
          await trx('users').insert(userData);

          // Force error with invalid data
          await trx('users').insert({
            phone_number: userData.phone_number, // Duplicate - should fail
            full_name: 'Should Rollback',
            role: 'karyawan',
          });
        });
      } catch (error) {
        // Expected to fail
      }

      // Verify rollback - user should not exist
      const user = await userRepository.findByPhone(userData.phone_number);
      expect(user).toBeNull();
    });
  });
});
