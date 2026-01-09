/**
 * Add transaction templates
 *
 * Features:
 * - Save frequent transactions as templates
 * - Quick create from template
 * - Share templates (admin only)
 * - Template usage tracking
 */

exports.up = function (knex) {
  return knex.schema.createTable('transaction_templates', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.text('description').nullable();
    table.integer('created_by').unsigned().notNullable();

    // Template data
    table.enum('type', ['paket', 'utang', 'jajan']).notNullable();
    table.integer('category_id').unsigned().nullable();
    table.decimal('default_amount', 15, 2).nullable(); // Nullable = ask user
    table.string('default_currency', 3).defaultTo('IDR');
    table.text('default_description').nullable();
    table.text('default_tags').nullable(); // JSON array of tag IDs

    // Sharing
    table.enum('visibility', ['private', 'shared', 'public']).defaultTo('private');
    table.text('shared_with_users').nullable(); // JSON array of user IDs

    // Usage tracking
    table.integer('usage_count').defaultTo(0);
    table.timestamp('last_used_at').nullable();

    // Metadata
    table.boolean('is_favorite').defaultTo(false);
    table.integer('sort_order').defaultTo(0);
    table.text('metadata').nullable(); // JSON
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('category_id').references('id').inTable('categories').onDelete('SET NULL');

    // Indexes
    table.index('created_by');
    table.index('visibility');
    table.index(['created_by', 'is_favorite']);
    table.index('usage_count');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('transaction_templates');
};
