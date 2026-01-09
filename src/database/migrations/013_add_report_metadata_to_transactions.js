/**
 * Add metadata fields to support advanced reporting
 */

exports.up = function (knex) {
  return knex.schema.table('transactions', (table) => {
    // Add fields useful for reporting
    table.decimal('profit_margin', 5, 2).nullable(); // For profit calculations
    table.decimal('cost_price', 15, 2).nullable(); // Cost of goods (for paket)
    table.string('reference_number', 50).nullable(); // External reference
    table.jsonb('custom_fields').nullable(); // Extensible custom data

    // Add indexes for report queries
    table.index(['transaction_date', 'status'], 'idx_trx_date_status');
    table.index(['type', 'transaction_date'], 'idx_trx_type_date');
  });
};

exports.down = function (knex) {
  return knex.schema.table('transactions', (table) => {
    // Drop indexes first
    table.dropIndex(['transaction_date', 'status'], 'idx_trx_date_status');
    table.dropIndex(['type', 'transaction_date'], 'idx_trx_type_date');

    // Drop columns
    table.dropColumn('profit_margin');
    table.dropColumn('cost_price');
    table.dropColumn('reference_number');
    table.dropColumn('custom_fields');
  });
};
