// File: src/database/migrations/001_create_users_table.js

exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('phone_number', 20).notNullable().unique();
    table.string('full_name', 100).notNullable();
    table.enu('role', ['superadmin', 'admin', 'karyawan', 'investor']).notNullable();
    table.enu('status', ['active', 'suspended', 'inactive']).defaultTo('active');
    table.string('pin', 255).nullable(); // bcrypt hash
    table.integer('created_by').unsigned().nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.jsonb('metadata').nullable(); // or json for SQLite

    // Indexes
    table.index('phone_number');
    table.index('role');
    table.index(['role', 'status']);

    // Foreign key
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
