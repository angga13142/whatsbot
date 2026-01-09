// File: src/database/migrations/005_create_system_config_table.js

exports.up = function (knex) {
  return knex.schema.createTable('system_config', (table) => {
    table.string('key', 100).primary();
    table.text('value').notNullable();
    table.text('description').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('updated_by').unsigned().nullable();

    // Foreign key
    table.foreign('updated_by').references('id').inTable('users').onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('system_config');
};
