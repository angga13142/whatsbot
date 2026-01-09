/**
 * Transaction Service Unit Tests
 */

const transactionService = require('../../../src/services/transactionService');
const transactionRepository = require('../../../src/database/repositories/transactionRepository');
const userRepository = require('../../../src/database/repositories/userRepository');
const auditRepository = require('../../../src/database/repositories/auditRepository');
const validator = require('../../../src/utils/validator');
const config = require('../../../src/config/app');

// Mocks
jest.mock('../../../src/database/repositories/transactionRepository');
jest.mock('../../../src/database/repositories/userRepository');
jest.mock('../../../src/database/repositories/auditRepository');
jest.mock('../../../src/utils/validator');
jest.mock('../../../src/config/app', () => ({
  business: {
    autoApprovalThreshold: 1000000,
  },
}));
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('Transaction Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    const validUserId = 1;
    const validData = {
      type: 'paket',
      amount: 50000,
      description: 'Test paket',
    };

    test('creates transaction successfully (auto-approve)', async () => {
      // Mock user
      userRepository.findById.mockResolvedValue({ id: validUserId, role: 'karyawan' });
      // Mock validation
      validator.validateTransactionData.mockReturnValue({ valid: true });
      // Mock existing transactions for ID generation
      transactionRepository.findByDateRange.mockResolvedValue([]);
      // Mock create
      transactionRepository.create.mockResolvedValue({
        id: 1,
        transaction_id: 'TRX-20260109-001',
        ...validData,
        status: 'approved',
      });

      const result = await transactionService.createTransaction(
        validUserId,
        validData.type,
        validData.amount,
        validData.description
      );

      expect(result.status).toBe('approved');
      expect(transactionRepository.create).toHaveBeenCalled();
      expect(auditRepository.log).toHaveBeenCalled();
    });

    test('creates transaction successfully (pending)', async () => {
      // Mock user
      userRepository.findById.mockResolvedValue({ id: validUserId, role: 'karyawan' });
      // Mock validation
      validator.validateTransactionData.mockReturnValue({ valid: true });
      // Mock existing transactions
      transactionRepository.findByDateRange.mockResolvedValue([]);

      const largeAmount = 2000000;
      transactionRepository.create.mockResolvedValue({
        id: 2,
        transaction_id: 'TRX-20260109-002',
        ...validData,
        amount: largeAmount,
        status: 'pending',
      });

      const result = await transactionService.createTransaction(
        validUserId,
        validData.type,
        largeAmount,
        validData.description
      );

      expect(result.status).toBe('pending');
    });

    test('prevents investor from creating transaction', async () => {
      userRepository.findById.mockResolvedValue({ id: 2, role: 'investor' });

      await expect(transactionService.createTransaction(2, 'paket', 1000, 'desc')).rejects.toThrow(
        'Investor tidak dapat membuat transaksi'
      );
    });

    test('validates transaction data', async () => {
      userRepository.findById.mockResolvedValue({ id: validUserId, role: 'karyawan' });
      validator.validateTransactionData.mockReturnValue({ valid: false, errors: ['Invalid'] });

      await expect(
        transactionService.createTransaction(validUserId, 'invalid', -100, 'desc')
      ).rejects.toThrow('Invalid');
    });

    test('throws if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(transactionService.createTransaction(999, 'paket', 100, 'desc')).rejects.toThrow(
        'User tidak ditemukan'
      );
    });
  });

  describe('approveTransaction', () => {
    test('approves pending transaction', async () => {
      const trxId = 'TRX-123';
      const approverId = 10;

      transactionRepository.findByTransactionId.mockResolvedValue({
        id: 1,
        transaction_id: trxId,
        status: 'pending',
        amount: 50000,
      });
      userRepository.findById.mockResolvedValue({ id: approverId, role: 'superadmin' });
      transactionRepository.updateStatus.mockResolvedValue({ id: 1, status: 'approved' });

      await transactionService.approveTransaction(trxId, approverId);

      expect(transactionRepository.updateStatus).toHaveBeenCalledWith(1, 'approved', approverId);
    });

    test('prevents non-admin from approving', async () => {
      const trxId = 'TRX-123';
      const approverId = 10;

      transactionRepository.findByTransactionId.mockResolvedValue({
        id: 1,
        transaction_id: trxId,
        status: 'pending',
      });
      userRepository.findById.mockResolvedValue({ id: approverId, role: 'karyawan' });

      await expect(transactionService.approveTransaction(trxId, approverId)).rejects.toThrow(
        'Hanya admin/superadmin yang dapat approve transaksi'
      );
    });
  });
});
