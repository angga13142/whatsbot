// File: src/database/migrations/004_create_bot_sessions_table.js

exports.up = function (knex) {
  return knex.schema.createTable('bot_sessions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable();
    table.string('phone_number', 20).notNullable();
    table.string('current_state', 50).nullable();
    table.jsonb('session_data').nullable(); // or json for SQLite
    table.timestamp('last_activity').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('phone_number');
    table.index('last_activity');

    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('bot_sessions');
};
