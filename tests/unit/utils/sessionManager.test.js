/**
 * Session Manager Unit Tests
 */

const { SESSION_STATES } = require('../../../src/utils/constants');

// Setup Mocks
const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  first: jest.fn(),
  update: jest.fn(),
  insert: jest.fn(),
  del: jest.fn(),
};

const mockKnex = jest.fn(() => mockQueryBuilder);

// Mock database connection
jest.mock('../../../src/database/connection', () => mockKnex);

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

const sessionManager = require('../../../src/utils/sessionManager');

describe('Session Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager.clearCache();

    // Default mocks
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.first.mockResolvedValue(null);
    mockQueryBuilder.update.mockResolvedValue(1);
    mockQueryBuilder.insert.mockResolvedValue([1]);
    mockQueryBuilder.del.mockResolvedValue(1);
  });

  describe('getSession', () => {
    test('returns null if no session found (DB and Cache empty)', async () => {
      mockQueryBuilder.first.mockResolvedValue(null);

      const session = await sessionManager.getSession('user1');
      expect(session).toBeNull();
      expect(mockKnex).toHaveBeenCalledWith('bot_sessions');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ phone_number: 'user1' });
    });

    test('returns session from DB when cache empty', async () => {
      const now = new Date();
      const mockDbSession = {
        phone_number: 'user1',
        current_state: 'IDLE',
        session_data: '{"key":"value"}',
        last_activity: now.toISOString(), // SQLite stores as string usually or timestamp
        created_at: now,
      };

      mockQueryBuilder.first.mockResolvedValue(mockDbSession);

      const session = await sessionManager.getSession('user1');
      expect(session).toEqual({
        phoneNumber: 'user1',
        state: 'IDLE',
        data: { key: 'value' },
        lastActivity: expect.any(Date),
      });
    });

    test('returns session from Cache', async () => {
      // Seed cache via createSession or manually if exposed?
      // We can use createSession to seed it
      await sessionManager.createSession('user2', 'TEST');

      // Clear DB mock to ensure it's not called
      mockKnex.mockClear();

      const session = await sessionManager.getSession('user2');
      expect(session.state).toBe('TEST');
      expect(mockKnex).not.toHaveBeenCalled();
    });

    test('handles invalid JSON in DB', async () => {
      const mockDbSession = {
        phone_number: 'user1',
        current_state: 'IDLE',
        session_data: 'invalid-json',
        last_activity: new Date(),
      };
      mockQueryBuilder.first.mockResolvedValue(mockDbSession);

      const session = await sessionManager.getSession('user1');
      expect(session.data).toEqual({});
    });
  });

  describe('createSession', () => {
    test('inserts new session if not exists', async () => {
      mockQueryBuilder.first.mockResolvedValue(null); // Check existing returns null (upsert logic in sessionManager)

      await sessionManager.createSession('user1', 'START');

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          phone_number: 'user1',
          current_state: 'START',
        })
      );
    });

    test('updates existing session if exists', async () => {
      mockQueryBuilder.first.mockResolvedValue({ phone_number: 'user1' });

      await sessionManager.createSession('user1', 'START');

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_state: 'START',
        })
      );
    });
  });

  describe('updateSession', () => {
    test('creates new session if not exists', async () => {
      mockQueryBuilder.first.mockResolvedValue(null); // getSession returns null

      // Spy on createSession? No need, just verify behaviors
      // Logic: getSession -> null -> createSession

      await sessionManager.updateSession('user1', { state: 'NEW' });

      expect(mockQueryBuilder.insert).toHaveBeenCalled();
    });

    test('updates existing session', async () => {
      // Mock getSession return
      mockQueryBuilder.first.mockResolvedValue({
        phone_number: 'user1',
        current_state: 'OLD',
        session_data: '{}',
        last_activity: new Date(),
      });

      await sessionManager.updateSession('user1', { state: 'NEW', data: { foo: 'bar' } });

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_state: 'NEW',
          session_data: JSON.stringify({ foo: 'bar' }),
        })
      );
    });
  });

  describe('deleteSession', () => {
    test('deletes from db and cache', async () => {
      await sessionManager.deleteSession('user1');
      expect(mockQueryBuilder.del).toHaveBeenCalled();
    });
  });

  describe('Helper methods', () => {
    test('setState calls updateSession', async () => {
      // Mock updateSession behavior? simpler to mock DB
      mockQueryBuilder.first.mockResolvedValue({
        phone_number: 'user1',
        current_state: 'OLD',
        session_data: '{}',
        last_activity: new Date(),
      });

      await sessionManager.setState('user1', 'NEXT');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_state: 'NEXT',
        })
      );
    });

    test('setData calls updateSession', async () => {
      mockQueryBuilder.first.mockResolvedValue({
        phone_number: 'user1',
        current_state: 'OLD',
        session_data: '{}',
        last_activity: new Date(),
      });

      await sessionManager.setData('user1', 'key', 'value');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          session_data: JSON.stringify({ key: 'value' }),
        })
      );
    });
  });
});
