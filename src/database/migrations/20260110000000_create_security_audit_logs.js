exports.up = function (knex) {
  return knex.schema.createTable('security_audit_logs', function (table) {
    table.increments('id').primary();
    table.string('event_type').notNullable().index();
    table.integer('user_id').nullable().index();
    table.string('severity').defaultTo('low');
    table.json('details').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).index();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('security_audit_logs');
};
