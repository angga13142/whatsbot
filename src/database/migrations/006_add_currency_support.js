/**
 * Add currency support to transactions
 *
 * Features:
 * - Store amount in multiple currencies
 * - Track exchange rates
 * - Support currency conversion
 */

exports.up = function (knex) {
  return (
    knex.schema
      // Add currency fields to transactions
      .table('transactions', (table) => {
        table.string('currency', 3).defaultTo('IDR'); // ISO 4217 code
        table.decimal('amount_base', 15, 2).nullable(); // Amount in base currency (IDR)
        table.decimal('exchange_rate', 12, 6).nullable(); // Exchange rate used
        table.text('currency_data').nullable(); // Additional currency info (JSON)
      })
      // Create currency_rates table
      .createTable('currency_rates', (table) => {
        table.increments('id').primary();
        table.string('from_currency', 3).notNullable();
        table.string('to_currency', 3).notNullable();
        table.decimal('rate', 12, 6).notNullable();
        table.timestamp('valid_from').defaultTo(knex.fn.now());
        table.timestamp('valid_until').nullable();
        table.string('source', 50).defaultTo('manual'); // manual, api, system
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Indexes
        table.index(['from_currency', 'to_currency', 'valid_from']);
        table.index('valid_from');
      })
      // Create user_currency_preferences
      .createTable('user_currency_preferences', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable();
        table.string('preferred_currency', 3).defaultTo('IDR');
        table.boolean('auto_convert').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Foreign key
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.unique('user_id');
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('user_currency_preferences')
    .dropTableIfExists('currency_rates')
    .table('transactions', (table) => {
      table.dropColumn('currency');
      table.dropColumn('amount_base');
      table.dropColumn('exchange_rate');
      table.dropColumn('currency_data');
    });
};
