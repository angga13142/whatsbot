exports.up = function (knex) {
  return knex.schema.createTable('error_logs', function (table) {
    table.increments('id').primary();
    table.string('error_name');
    table.text('error_message');
    table.text('error_stack');
    table.integer('user_id').nullable();
    table.json('context');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Index for performance
    table.index(['created_at']);
    table.index(['error_name']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('error_logs');
};
