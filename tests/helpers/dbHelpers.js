/**
 * Database Test Helpers
 *
 * Helper functions for database testing
 */

const path = require('path');

/**
 * Setup test database
 * @param {Object} knex - Knex instance
 */
async function setupTestDatabase(knex) {
  // Run migrations
  await knex.migrate.latest({
    directory: path.join(__dirname, '../../src/database/migrations'),
  });
}

/**
 * Teardown test database
 * @param {Object} knex - Knex instance
 */
async function teardownTestDatabase(knex) {
  await knex.migrate.rollback(
    {
      directory: path.join(__dirname, '../../src/database/migrations'),
    },
    true
  );
}

/**
 * Seed test data
 * @param {Object} knex - Knex instance
 * @param {Object} data - Data to seed
 */
async function seedTestData(knex, data) {
  // Insert users
  if (data.users) {
    await knex('users').insert(data.users);
  }

  // Insert transactions
  if (data.transactions) {
    await knex('transactions').insert(data.transactions);
  }

  // Insert audit logs
  if (data.auditLogs) {
    await knex('audit_logs').insert(data.auditLogs);
  }
}

/**
 * Clear all tables
 * @param {Object} knex - Knex instance
 */
async function clearAllTables(knex) {
  await knex('audit_logs').delete();
  await knex('bot_sessions').delete();
  await knex('transactions').delete();
  await knex('users').delete();
  await knex('system_config').delete();
}

/**
 * Get table count
 * @param {Object} knex - Knex instance
 * @param {string} table - Table name
 * @returns {Promise<number>} Row count
 */
async function getTableCount(knex, table) {
  const result = await knex(table).count('* as count').first();
  return result.count;
}

/**
 * Assert table has rows
 * @param {Object} knex - Knex instance
 * @param {string} table - Table name
 * @param {number} expectedCount - Expected row count
 */
async function assertTableCount(knex, table, expectedCount) {
  const count = await getTableCount(knex, table);
  expect(count).toBe(expectedCount);
}

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
  seedTestData,
  clearAllTables,
  getTableCount,
  assertTableCount,
};
