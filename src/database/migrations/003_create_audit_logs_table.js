// File: src/database/migrations/003_create_audit_logs_table.js

exports.up = function (knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable();
    table.string('action', 100).notNullable();
    table.string('entity_type', 50).nullable();
    table.integer('entity_id').nullable();
    table.jsonb('details').nullable(); // or json for SQLite
    table.string('ip_address', 50).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('action');
    table.index('created_at');
    table.index(['user_id', 'created_at']);

    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};
