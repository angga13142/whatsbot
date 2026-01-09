/**
 * User Service Unit Tests
 */

const userService = require('../../../src/services/userService');
const userRepository = require('../../../src/database/repositories/userRepository');
const auditRepository = require('../../../src/database/repositories/auditRepository');
const { generateUserData } = require('../../helpers/testHelpers');

// Mock repositories
jest.mock('../../../src/database/repositories/userRepository');
jest.mock('../../../src/database/repositories/auditRepository');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    test('creates user successfully with valid data', async () => {
      const creatorId = 1;
      const userData = generateUserData('karyawan');

      // Mock repository responses
      userRepository.findById.mockResolvedValue({ id: 1, role: 'admin' });
      userRepository.findByPhone.mockResolvedValue(null); // No existing user
      userRepository.create.mockResolvedValue({ id: 2, ...userData });
      auditRepository.log.mockResolvedValue(true);

      const result = await userService.createUser(
        userData.phone_number,
        userData.full_name,
        userData.role,
        creatorId
      );

      expect(result).toBeDefined();
      expect(result.phone_number).toBe(userData.phone_number);
      expect(userRepository.create).toHaveBeenCalled();
      expect(auditRepository.log).toHaveBeenCalled();
    });

    test('throws error for invalid phone number', async () => {
      const creatorId = 1;

      userRepository.findById.mockResolvedValue({ id: 1, role: 'admin' });

      await expect(
        userService.createUser('invalid', 'Test User', 'karyawan', creatorId)
      ).rejects.toThrow();
    });

    test('throws error for duplicate phone number', async () => {
      const creatorId = 1;
      const userData = generateUserData('karyawan');

      userRepository.findById.mockResolvedValue({ id: 1, role: 'admin' });
      userRepository.findByPhone.mockResolvedValue({ id: 2 }); // Existing user

      await expect(
        userService.createUser(userData.phone_number, userData.full_name, userData.role, creatorId)
      ).rejects.toThrow('sudah terdaftar');
    });

    test('enforces role hierarchy', async () => {
      const creatorId = 1;

      // Karyawan trying to create admin (should fail)
      userRepository.findById.mockResolvedValue({ id: 1, role: 'karyawan' });
      userRepository.findByPhone.mockResolvedValue(null);

      await expect(
        userService.createUser('628111111111', 'Test', 'admin', creatorId)
      ).rejects.toThrow('tidak memiliki izin');
    });
  });

  describe('suspendUser', () => {
    test('suspends user successfully', async () => {
      const userId = 2;
      const suspenderId = 1;

      userRepository.findById
        .mockResolvedValueOnce({ id: userId, role: 'karyawan', status: 'active' })
        .mockResolvedValueOnce({ id: suspenderId, role: 'admin' })
        .mockResolvedValueOnce({ id: userId, role: 'karyawan', status: 'suspended' });

      userRepository.suspend.mockResolvedValue(true);
      auditRepository.log.mockResolvedValue(true);

      const result = await userService.suspendUser(userId, 'Test reason', suspenderId);

      expect(result.status).toBe('suspended');
      expect(userRepository.suspend).toHaveBeenCalledWith(userId);
      expect(auditRepository.log).toHaveBeenCalled();
    });

    test('prevents suspending already suspended user', async () => {
      const userId = 2;
      const suspenderId = 1;

      userRepository.findById
        .mockResolvedValueOnce({ id: userId, role: 'karyawan', status: 'suspended' })
        .mockResolvedValueOnce({ id: suspenderId, role: 'admin' });

      await expect(userService.suspendUser(userId, 'Test', suspenderId)).rejects.toThrow(
        'sudah dalam status suspended'
      );
    });
  });

  describe('setup2FA', () => {
    test('sets up 2FA PIN successfully', async () => {
      const userId = 2;
      const pin = '123456';

      userRepository.findById.mockResolvedValue({ id: userId });
      userRepository.updatePin.mockResolvedValue(true);
      auditRepository.log.mockResolvedValue(true);

      const result = await userService.setup2FA(userId, pin);

      expect(result).toBe(true);
      expect(userRepository.updatePin).toHaveBeenCalled();
      // Check that PIN was hashed (not stored as plain text)
      const hashedPin = userRepository.updatePin.mock.calls[0][1];
      expect(hashedPin).not.toBe(pin);
    });

    test('rejects invalid PIN format', async () => {
      const userId = 2;

      userRepository.findById.mockResolvedValue({ id: userId });

      await expect(
        userService.setup2FA(userId, '123') // Too short
      ).rejects.toThrow('6 digit');
    });
  });
});
