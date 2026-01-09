// File: tests/unit/repositories/userRepository.test.js

const userRepository = require('../../../src/database/repositories/userRepository');
const db = require('../../../src/database/connection');

// Mock data
const mockUser = {
  phone_number: '081234567890',
  full_name: 'Test Karyawan',
  role: 'karyawan',
  status: 'active',
};

describe('UserRepository', () => {
  // Setup: Clean DB before these tests
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  // Clean between tests
  afterEach(async () => {
    await db('users').del();
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const user = await userRepository.create(mockUser);
      expect(user).toHaveProperty('id');
      expect(user.phone_number).toBe(mockUser.phone_number);
    });

    it('should throw error for duplicate phone', async () => {
      await userRepository.create(mockUser);
      await expect(userRepository.create(mockUser)).rejects.toThrow();
    });
  });

  describe('findByPhone', () => {
    it('should return user when phone exists', async () => {
      await userRepository.create(mockUser);
      const user = await userRepository.findByPhone(mockUser.phone_number);
      expect(user).not.toBeNull();
      expect(user.full_name).toBe(mockUser.full_name);
    });

    it('should return null when phone does not exist', async () => {
      const user = await userRepository.findByPhone('0000000000');
      expect(user).toBeNull();
    });
  });
});
