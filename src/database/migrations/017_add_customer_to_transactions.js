/**
 * Add customer_id to transactions
 *
 * Link transactions to customers for invoicing
 */

exports.up = function (knex) {
  return knex.schema
    .table('transactions', (table) => {
      table
        .integer('customer_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
        .comment('Customer reference for invoicing');

      table.index('customer_id');
    })
    .then(() => {
      console.log('✅ Added customer_id to transactions');
    });
};

exports.down = function (knex) {
  return knex.schema.table('transactions', (table) => {
    table.dropColumn('customer_id');
  });
};
