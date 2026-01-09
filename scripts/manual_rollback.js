const knex = require('knex');
const path = require('path');

// Database configuration
const dbConfig = {
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, '../storage/database.sqlite'),
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, '../src/database/migrations'),
    tableName: 'knex_migrations',
  },
};

const db = knex(dbConfig);

async function rollback() {
  try {
    console.log('Rolling back last batch...');
    await db.migrate.rollback();
    console.log('Rollback complete!');
  } catch (error) {
    console.error('Rollback failed:', error);
  } finally {
    await db.destroy();
  }
}

rollback();
