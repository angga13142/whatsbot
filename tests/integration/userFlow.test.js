/**
 * User Flow Integration Tests
 *
 * Tests complete user management workflows
 */

const userService = require('../../src/services/userService');
const userRepository = require('../../src/database/repositories/userRepository');
const auditRepository = require('../../src/database/repositories/auditRepository');
const knex = require('../../src/database/connection');
const { generateUserData, cleanTestData } = require('../helpers/testHelpers');
const { setupTestDatabase } = require('../helpers/dbHelpers');
const bcrypt = require('bcrypt');

describe('User Flow Integration Tests', () => {
  let superadminId;
  let adminId;
  let karyawanId;

  beforeAll(async () => {
    await setupTestDatabase(knex);
    await cleanTestData(knex);

    // Create superadmin for testing
    const superadmin = await userRepository.create({
      phone_number: '628999999990',
      full_name: 'Test Superadmin',
      role: 'superadmin',
      status: 'active',
    });
    superadminId = superadmin.id;
  });

  afterAll(async () => {
    await cleanTestData(knex);
    await knex.destroy();
  });

  describe('User Creation Flow', () => {
    test('superadmin creates admin successfully', async () => {
      const adminData = generateUserData('admin');

      const admin = await userService.createUser(
        adminData.phone_number,
        adminData.full_name,
        'admin',
        superadminId
      );

      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
      expect(admin.created_by).toBe(superadminId);

      adminId = admin.id;

      // Verify audit log
      const logs = await auditRepository.findByUser(superadminId, 10);
      const createLog = logs.find((log) => log.action === 'create_user');
      expect(createLog).toBeDefined();
    });

    test('admin creates karyawan successfully', async () => {
      const karyawanData = generateUserData('karyawan');

      const karyawan = await userService.createUser(
        karyawanData.phone_number,
        karyawanData.full_name,
        'karyawan',
        adminId
      );

      expect(karyawan).toBeDefined();
      expect(karyawan.role).toBe('karyawan');
      expect(karyawan.created_by).toBe(adminId);

      karyawanId = karyawan.id;
    });

    test('admin creates investor successfully', async () => {
      const investorData = generateUserData('investor');

      const investor = await userService.createUser(
        investorData.phone_number,
        investorData.full_name,
        'investor',
        adminId
      );

      expect(investor).toBeDefined();
      expect(investor.role).toBe('investor');
    });

    test('prevents duplicate phone number', async () => {
      const karyawan = await userRepository.findById(karyawanId);

      await expect(
        userService.createUser(karyawan.phone_number, 'Duplicate User', 'karyawan', adminId)
      ).rejects.toThrow('sudah terdaftar');
    });

    test('enforces role hierarchy - karyawan cannot create admin', async () => {
      const userData = generateUserData('admin');

      await expect(
        userService.createUser(
          userData.phone_number,
          userData.full_name,
          'admin',
          karyawanId // karyawan trying to create admin
        )
      ).rejects.toThrow('tidak memiliki izin');
    });
  });

  describe('User Update Flow', () => {
    test('updates user name successfully', async () => {
      const updated = await userService.updateUser(
        karyawanId,
        { full_name: 'Updated Karyawan Name' },
        adminId
      );

      expect(updated.full_name).toBe('Updated Karyawan Name');

      // Verify audit log
      const logs = await auditRepository.findByUser(adminId, 10);
      const updateLog = logs.find((log) => log.action === 'update_user');
      expect(updateLog).toBeDefined();
    });

    test('prevents unauthorized update', async () => {
      await expect(
        userService.updateUser(
          adminId, // trying to update admin
          { full_name: 'Unauthorized' },
          karyawanId // karyawan cannot update admin
        )
      ).rejects.toThrow('tidak memiliki izin');
    });
  });

  describe('User Suspension Flow', () => {
    test('admin suspends karyawan', async () => {
      const suspended = await userService.suspendUser(karyawanId, 'Test suspension', adminId);

      expect(suspended.status).toBe('suspended');

      // Verify audit log
      const logs = await auditRepository.findByUser(adminId, 10);
      const suspendLog = logs.find((log) => log.action === 'suspend_user');
      expect(suspendLog).toBeDefined();
      expect(suspendLog.details.reason).toBe('Test suspension');
    });

    test('prevents operations on suspended user', async () => {
      const userData = generateUserData('karyawan');

      await expect(
        userService.createUser(
          userData.phone_number,
          userData.full_name,
          'karyawan',
          karyawanId // suspended user
        )
      ).rejects.toThrow();
    });

    test('admin unsuspends karyawan', async () => {
      const unsuspended = await userService.unsuspendUser(karyawanId, adminId);

      expect(unsuspended.status).toBe('active');

      // Verify audit log
      const logs = await auditRepository.findByUser(adminId, 10);
      const unsuspendLog = logs.find((log) => log.action === 'unsuspend_user');
      expect(unsuspendLog).toBeDefined();
    });
  });

  describe('Role Change Flow', () => {
    test('superadmin changes karyawan to admin', async () => {
      const updated = await userService.changeUserRole(karyawanId, 'admin', superadminId);

      expect(updated.role).toBe('admin');

      // Verify audit log
      const logs = await auditRepository.findByUser(superadminId, 10);
      const roleChangeLog = logs.find((log) => log.action === 'change_user_role');
      expect(roleChangeLog).toBeDefined();
      expect(roleChangeLog.details.oldRole).toBe('karyawan');
      expect(roleChangeLog.details.newRole).toBe('admin');
    });

    test('only superadmin can change roles', async () => {
      await expect(
        userService.changeUserRole(
          karyawanId,
          'investor',
          adminId // admin trying to change role
        )
      ).rejects.toThrow('Hanya superadmin');
    });
  });

  describe('2FA Setup Flow', () => {
    test('sets up 2FA PIN for user', async () => {
      const result = await userService.setup2FA(adminId, '123456');

      expect(result).toBe(true);

      // Verify PIN is hashed
      const user = await userRepository.findById(adminId);
      expect(user.pin).toBeDefined();
      expect(user.pin).not.toBe('123456'); // Should be hashed

      // Verify audit log
      const logs = await auditRepository.findByUser(adminId, 10);
      const setupLog = logs.find((log) => log.action === 'setup_2fa');
      expect(setupLog).toBeDefined();
    });

    test('verifies 2FA PIN correctly', async () => {
      const isValid = await userService.verify2FA(adminId, '123456');

      expect(isValid).toBe(true);

      // Verify audit log
      const logs = await auditRepository.findByUser(adminId, 10);
      const verifyLog = logs.find((log) => log.action === '2fa_verification');
      expect(verifyLog).toBeDefined();
    });

    test('rejects incorrect PIN', async () => {
      const isValid = await userService.verify2FA(adminId, '999999');

      expect(isValid).toBe(false);
    });

    test('rejects invalid PIN format', async () => {
      await expect(
        userService.setup2FA(adminId, '123') // Too short
      ).rejects.toThrow('6 digit');
    });
  });

  describe('User Deletion Flow', () => {
    let userToDelete;

    beforeAll(async () => {
      const userData = generateUserData('karyawan');
      userToDelete = await userRepository.create(userData);
    });

    test('only superadmin can delete users', async () => {
      await expect(
        userService.deleteUser(userToDelete.id, adminId) // admin trying to delete
      ).rejects.toThrow('Hanya superadmin');
    });

    test('superadmin deletes user (soft delete)', async () => {
      const result = await userService.deleteUser(userToDelete.id, superadminId);

      expect(result).toBe(true);

      // Verify soft delete (status = inactive)
      const user = await userRepository.findById(userToDelete.id);
      expect(user.status).toBe('inactive');

      // Verify audit log
      const logs = await auditRepository.findByUser(superadminId, 10);
      const deleteLog = logs.find((log) => log.action === 'delete_user');
      expect(deleteLog).toBeDefined();
    });
  });

  describe('User Listing Flow', () => {
    test('lists all users', async () => {
      const users = await userService.listUsers();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    test('filters users by role', async () => {
      const admins = await userService.listUsers({ role: 'admin' });

      expect(Array.isArray(admins)).toBe(true);
      admins.forEach((user) => {
        expect(user.role).toBe('admin');
      });
    });

    test('filters users by status', async () => {
      const activeUsers = await userService.listUsers({ status: 'active' });

      expect(Array.isArray(activeUsers)).toBe(true);
      activeUsers.forEach((user) => {
        expect(user.status).toBe('active');
      });
    });
  });
});
