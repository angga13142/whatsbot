/**
 * Add tagging system
 *
 * Features:
 * - Multiple tags per transaction
 * - Tag-based filtering
 * - Tag analytics
 * - Tag suggestions
 */

exports.up = function (knex) {
  return (
    knex.schema
      .createTable('tags', (table) => {
        table.increments('id').primary();
        table.string('name', 50).notNullable();
        table.string('slug', 50).notNullable().unique();
        table.string('color', 7).nullable(); // Hex color
        table.text('description').nullable();
        table.integer('usage_count').defaultTo(0); // Track popularity
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Indexes
        table.index('slug');
        table.index('usage_count');
      })
      // Many-to-many relationship
      .createTable('transaction_tags', (table) => {
        table.increments('id').primary();
        table.integer('transaction_id').unsigned().notNullable();
        table.integer('tag_id').unsigned().notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());

        // Foreign keys
        table
          .foreign('transaction_id')
          .references('id')
          .inTable('transactions')
          .onDelete('CASCADE');
        table.foreign('tag_id').references('id').inTable('tags').onDelete('CASCADE');

        // Unique constraint
        table.unique(['transaction_id', 'tag_id']);

        // Indexes
        table.index('transaction_id');
        table.index('tag_id');
      })
  );
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('transaction_tags').dropTableIfExists('tags');
};
