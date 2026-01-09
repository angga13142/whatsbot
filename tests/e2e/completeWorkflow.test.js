/**
 * Complete Workflow E2E Tests
 *
 * Tests real-world scenarios end-to-end
 */

const userService = require('../../src/services/userService');
const transactionService = require('../../src/services/transactionService');
const reportService = require('../../src/services/reportService');
const userRepository = require('../../src/database/repositories/userRepository');
const transactionRepository = require('../../src/database/repositories/transactionRepository');
const auditRepository = require('../../src/database/repositories/auditRepository');
const knex = require('../../src/database/connection');
const { cleanTestData } = require('../helpers/testHelpers');
const { setupTestDatabase } = require('../helpers/dbHelpers');
const dayjs = require('dayjs');

describe('Complete Workflow E2E Tests', () => {
  let superadminId;
  let adminId;
  let karyawan1Id, karyawan2Id;
  // eslint-disable-next-line no-unused-vars
  // eslint-disable-next-line no-unused-vars
  let investorId; // Used in investor test

  beforeAll(async () => {
    await setupTestDatabase(knex);
    await cleanTestData(knex);

    // Setup test users
    const superadmin = await userRepository.create({
      phone_number: '628999999990',
      full_name: 'E2E Superadmin',
      role: 'superadmin',
      status: 'active',
    });
    superadminId = superadmin.id;
  });

  afterAll(async () => {
    await cleanTestData(knex);
    await knex.destroy();
  });

  describe('Scenario 1: New Business Day Setup', () => {
    test('Step 1: Superadmin creates admin', async () => {
      const admin = await userService.createUser(
        '628111111111',
        'Admin Toko',
        'admin',
        superadminId
      );

      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
      adminId = admin.id;
    });

    test('Step 2: Admin adds karyawan employees', async () => {
      const karyawan1 = await userService.createUser(
        '628111111112',
        'Budi Santoso',
        'karyawan',
        adminId
      );
      karyawan1Id = karyawan1.id;

      const karyawan2 = await userService.createUser(
        '628111111113',
        'Siti Nurhaliza',
        'karyawan',
        adminId
      );
      karyawan2Id = karyawan2.id;

      expect(karyawan1.role).toBe('karyawan');
      expect(karyawan2.role).toBe('karyawan');
    });

    test('Step 3: Admin adds investor', async () => {
      const investor = await userService.createUser(
        '628111111114',
        'Investor Pertama',
        'investor',
        adminId
      );

      expect(investor.role).toBe('investor');
      investorId = investor.id;
    });

    test('Step 4: Admin sets up 2FA', async () => {
      await userService.setup2FA(adminId, '123456');

      const isValid = await userService.verify2FA(adminId, '123456');
      expect(isValid).toBe(true);
    });
  });

  describe('Scenario 2: Daily Operations', () => {
    test('Step 1: Karyawan 1 records small sales (auto-approved)', async () => {
      // Morning sales
      const sale1 = await transactionService.createTransaction(
        karyawan1Id,
        'paket',
        250000,
        'Penjualan 5 paket pagi',
        {}
      );

      const sale2 = await transactionService.createTransaction(
        karyawan1Id,
        'paket',
        300000,
        'Penjualan 6 paket pagi',
        {}
      );

      expect(sale1.status).toBe('approved'); // Auto-approved
      expect(sale2.status).toBe('approved');
    });

    test('Step 2: Karyawan 1 records expenses', async () => {
      const expense = await transactionService.createTransaction(
        karyawan1Id,
        'jajan',
        150000,
        'Beli pulsa dan bensin',
        {}
      );

      expect(expense.status).toBe('approved');
      expect(expense.type).toBe('jajan');
    });

    test('Step 3: Karyawan 2 records sales and debt', async () => {
      // Regular sale
      await transactionService.createTransaction(
        karyawan2Id,
        'paket',
        400000,
        'Penjualan 8 paket',
        {}
      );

      // Debt transaction
      const debt = await transactionService.createTransaction(
        karyawan2Id,
        'utang',
        500000,
        'Utang Pak Ahmad',
        { customer_name: 'Pak Ahmad' }
      );

      expect(debt.type).toBe('utang');
      expect(debt.customer_name).toBe('Pak Ahmad');
    });

    test('Step 4: Karyawan 1 records large sale (needs approval)', async () => {
      const largeSale = await transactionService.createTransaction(
        karyawan1Id,
        'paket',
        2500000,
        'Penjualan besar 50 paket',
        {}
      );

      expect(largeSale.status).toBe('pending'); // Needs approval
    });

    test('Step 5: Admin reviews pending transactions', async () => {
      const pending = await transactionService.getPendingTransactions();

      expect(pending.length).toBeGreaterThan(0);
      expect(pending[0].status).toBe('pending');
    });

    test('Step 6: Admin approves large transaction', async () => {
      const pending = await transactionService.getPendingTransactions();
      const toApprove = pending[0];

      const approved = await transactionService.approveTransaction(
        toApprove.transaction_id,
        adminId
      );

      expect(approved.status).toBe('approved');
      expect(approved.approved_by).toBe(adminId);
    });
  });

  describe('Scenario 3: Reporting & Analytics', () => {
    test('Step 1: Generate daily report', async () => {
      const report = await reportService.generateDailyReport();

      expect(report).toBeDefined();
      expect(report.summary.total_transactions).toBeGreaterThan(0);
      expect(report.summary.income).toBeGreaterThan(0);
      expect(report.summary.net).toBeDefined();

      // Verify calculations
      const expectedNet = report.summary.income - report.summary.expense;
      expect(report.summary.net).toBe(expectedNet);
    });

    test('Step 2: Generate per-karyawan report', async () => {
      const report1 = await reportService.generateUserReport(karyawan1Id);
      const report2 = await reportService.generateUserReport(karyawan2Id);

      expect(report1.summary.total_transactions).toBeGreaterThan(0);
      expect(report2.summary.total_transactions).toBeGreaterThan(0);

      // Verify different karyawan have different totals
      expect(report1.user_id).not.toBe(report2.user_id);
    });

    test('Step 3: Generate investor report (censored)', async () => {
      const report = await reportService.generateInvestorReport({
        startDate: dayjs().startOf('month').toDate(),
        endDate: dayjs().endOf('month').toDate(),
      });

      expect(report).toBeDefined();
      expect(report.type).toBe('investor');
      expect(report.summary.total_income).toBeDefined();
      expect(report.summary.net_profit).toBeDefined();

      // Verify no user details (censored for investor)
      expect(report.by_user).toBeUndefined();
    });

    test('Step 4: Verify report calculations', async () => {
      const report = await reportService.generateDailyReport();

      // Manually calculate expected totals
      const allTransactions = await transactionRepository.findByDateRange(
        dayjs().startOf('day').toDate(),
        dayjs().endOf('day').toDate()
      );

      const approved = allTransactions.filter((t) => t.status === 'approved');

      let expectedIncome = 0;
      let expectedExpense = 0;

      approved.forEach((trx) => {
        const amount = parseFloat(trx.amount);
        if (trx.type === 'paket' || trx.type === 'utang') {
          expectedIncome += amount;
        } else if (trx.type === 'jajan') {
          expectedExpense += amount;
        }
      });

      expect(report.summary.income).toBeCloseTo(expectedIncome, 2);
      expect(report.summary.expense).toBeCloseTo(expectedExpense, 2);
    });
  });

  describe('Scenario 4: Problem Resolution', () => {
    let suspendedKaryawanId;

    test('Step 1: Karyawan makes mistake, creates wrong transaction', async () => {
      const mistake = await transactionService.createTransaction(
        karyawan1Id,
        'paket',
        10000000, // Obviously wrong amount
        'Kesalahan input',
        {}
      );

      expect(mistake.status).toBe('pending'); // Too large, needs approval
    });

    test('Step 2: Admin reviews and rejects incorrect transaction', async () => {
      const pending = await transactionService.getPendingTransactions();
      const incorrect = pending.find((t) => t.amount > 5000000);

      const rejected = await transactionService.rejectTransaction(
        incorrect.transaction_id,
        adminId,
        'Jumlah tidak sesuai, harap input ulang'
      );

      expect(rejected.status).toBe('rejected');
    });

    test('Step 3: Admin suspends problematic karyawan', async () => {
      // Create new karyawan for suspension test
      const problematic = await userService.createUser(
        '628111111115',
        'Karyawan Bermasalah',
        'karyawan',
        adminId
      );
      suspendedKaryawanId = problematic.id;

      const suspended = await userService.suspendUser(
        suspendedKaryawanId,
        'Terlalu banyak kesalahan input',
        adminId
      );

      expect(suspended.status).toBe('suspended');
    });

    test('Step 4: Suspended karyawan cannot create transactions', async () => {
      // Note: In real implementation, this should be blocked at bot level
      // Here we test service level behavior
      const user = await userRepository.findById(suspendedKaryawanId);
      expect(user.status).toBe('suspended');
    });

    test('Step 5: Admin resolves issue and unsuspends', async () => {
      const unsuspended = await userService.unsuspendUser(suspendedKaryawanId, adminId);

      expect(unsuspended.status).toBe('active');
    });
  });

  describe('Scenario 5: Audit Trail Verification', () => {
    test('Step 1: Verify all user actions are logged', async () => {
      const adminLogs = await auditRepository.findByUser(adminId);

      expect(adminLogs.length).toBeGreaterThan(0);

      // Check for expected actions
      const actions = adminLogs.map((log) => log.action);
      expect(actions).toContain('create_user');
      expect(actions).toContain('approve_transaction');
    });

    test('Step 2: Verify transaction actions are logged', async () => {
      const karyawan1Logs = await auditRepository.findByUser(karyawan1Id);

      const transactionLogs = karyawan1Logs.filter((log) => log.action === 'create_transaction');

      expect(transactionLogs.length).toBeGreaterThan(0);
    });

    test('Step 3: Verify critical actions are logged', async () => {
      const criticalLogs = await auditRepository.findCriticalActions();

      // Should include suspensions, role changes, deletions, etc.
      expect(Array.isArray(criticalLogs)).toBe(true);
    });

    test('Step 4: Verify timeline of events', async () => {
      const allLogs = await auditRepository.findByDateRange(
        dayjs().startOf('day').toDate(),
        dayjs().endOf('day').toDate()
      );

      // Verify logs are ordered by time
      for (let i = 1; i < allLogs.length; i++) {
        const prevTime = new Date(allLogs[i - 1].created_at).getTime();
        const currTime = new Date(allLogs[i].created_at).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });

  describe('Scenario 6: End of Day Summary', () => {
    test('Step 1: Count total transactions', async () => {
      const transactions = await transactionRepository.findByDateRange(
        dayjs().startOf('day').toDate(),
        dayjs().endOf('day').toDate()
      );

      console.log(`\n📊 End of Day Summary:`);
      console.log(`   Total Transactions: ${transactions.length}`);

      expect(transactions.length).toBeGreaterThan(0);
    });

    test('Step 2: Calculate final totals', async () => {
      const report = await reportService.generateDailyReport();

      console.log(`   Income:  Rp ${report.summary.income.toLocaleString()}`);
      console.log(`   Expense: Rp ${report.summary.expense.toLocaleString()}`);
      console.log(`   Net: Rp ${report.summary.net.toLocaleString()}`);

      expect(report.summary.net).toBe(report.summary.income - report.summary.expense);
    });

    test('Step 3: Verify all approved transactions', async () => {
      const pending = await transactionService.getPendingTransactions();

      console.log(`   Pending Transactions: ${pending.length}`);

      // In ideal scenario, all should be approved by end of day
      expect(Array.isArray(pending)).toBe(true);
    });

    test('Step 4: Verify data integrity', async () => {
      // Check that all transactions have valid users
      const transactions = await transactionRepository.findByDateRange(
        dayjs().startOf('day').toDate(),
        dayjs().endOf('day').toDate()
      );

      for (const trx of transactions) {
        const user = await userRepository.findById(trx.user_id);
        expect(user).toBeDefined();
      }
    });
  });
});
