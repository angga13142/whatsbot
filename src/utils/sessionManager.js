// File: src/utils/sessionManager.js

/**
 * Session Manager
 *
 * Purpose: Manage in-memory conversation state for multi-step commands.
 * Syncs specific state to DB if needed (implemented as in-memory for Phase 1 MVP speed,
 * but structure ready for persistent storage via repositories).
 *
 * @module utils/sessionManager
 */

const sessions = new Map();

module.exports = {
  createSession(phoneNumber, initialState = {}) {
    const session = {
      phoneNumber,
      state: 'IDLE',
      data: {},
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ...initialState,
    };
    sessions.set(phoneNumber, session);
    return session;
  },

  getSession(phoneNumber) {
    const session = sessions.get(phoneNumber);
    if (!session) return null;

    // Check expiry (e.g., 30 mins)
    if (Date.now() - session.lastActivity > 30 * 60 * 1000) {
      this.deleteSession(phoneNumber);
      return null;
    }

    // Update activity
    session.lastActivity = Date.now();
    return session;
  },

  updateSession(phoneNumber, updates) {
    const session = this.getSession(phoneNumber) || this.createSession(phoneNumber);

    if (updates.state) session.state = updates.state;
    if (updates.data) session.data = { ...session.data, ...updates.data };

    sessions.set(phoneNumber, session);
    return session;
  },

  deleteSession(phoneNumber) {
    sessions.delete(phoneNumber);
  },

  setState(phoneNumber, state) {
    return this.updateSession(phoneNumber, { state });
  },

  getState(phoneNumber) {
    const session = this.getSession(phoneNumber);
    return session ? session.state : null;
  },
};
