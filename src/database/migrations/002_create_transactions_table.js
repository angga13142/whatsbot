// File: src/database/migrations/002_create_transactions_table.js

exports.up = function (knex) {
  return knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table.string('transaction_id', 50).notNullable().unique(); // TRX-YYYYMMDD-NNN
    table.integer('user_id').unsigned().notNullable();
    table.enu('type', ['paket', 'utang', 'jajan']).notNullable();
    table.string('category', 50).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.text('description').nullable();
    table.string('customer_name', 100).nullable(); // for 'utang' type
    table.text('image_url').nullable();
    table.enu('status', ['pending', 'approved', 'rejected']).defaultTo('approved');
    table.integer('approved_by').unsigned().nullable();
    table.timestamp('approved_at').nullable();
    table.timestamp('transaction_date').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.jsonb('metadata').nullable(); // or json for SQLite

    // Indexes
    table.index('transaction_id');
    table.index('user_id');
    table.index('type');
    table.index('status');
    table.index('transaction_date');
    table.index(['user_id', 'transaction_date']);

    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('transactions');
};
