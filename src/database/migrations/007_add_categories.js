/**
 * Add transaction categories
 *
 * Features:
 * - Hierarchical categories (parent-child)
 * - Custom categories per business
 * - Default categories
 * - Category-based budgets
 */

exports.up = function (knex) {
  return (
    knex.schema
      .createTable('categories', (table) => {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.string('slug', 100).notNullable();
        table.text('description').nullable();
        table.integer('parent_id').unsigned().nullable(); // For subcategories
        table.string('icon', 50).nullable(); // Emoji or icon identifier
        table.string('color', 7).nullable(); // Hex color code
        table.enum('type', ['income', 'expense', 'both']).defaultTo('both');
        table.boolean('is_system').defaultTo(false); // System vs custom
        table.boolean('is_active').defaultTo(true);
        table.integer('sort_order').defaultTo(0);
        table.text('metadata').nullable(); // JSON metadata
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Self-reference for hierarchical categories
        table.foreign('parent_id').references('id').inTable('categories').onDelete('SET NULL');

        // Indexes
        table.index('slug');
        table.index('parent_id');
        table.index(['type', 'is_active']);
      })
      // Link transactions to categories
      .table('transactions', (table) => {
        table.integer('category_id').unsigned().nullable();
        table.foreign('category_id').references('id').inTable('categories').onDelete('SET NULL');
        table.index('category_id');
      })
      // Category budgets
      .createTable('category_budgets', (table) => {
        table.increments('id').primary();
        table.integer('category_id').unsigned().notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.string('period', 20).notNullable(); // daily, weekly, monthly, yearly
        table.date('start_date').notNullable();
        table.date('end_date').nullable();
        table.boolean('is_active').defaultTo(true);
        table.text('alert_settings').nullable(); // JSON alert thresholds
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Foreign key
        table.foreign('category_id').references('id').inTable('categories').onDelete('CASCADE');

        // Indexes
        table.index(['category_id', 'is_active']);
        table.index(['start_date', 'end_date']);
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('category_budgets')
    .table('transactions', (table) => {
      table.dropForeign(['category_id']);
      table.dropColumn('category_id');
    })
    .dropTableIfExists('categories');
};
