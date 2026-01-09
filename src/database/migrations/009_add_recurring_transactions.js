/**
 * Add recurring transactions
 *
 * Features:
 * - Scheduled automatic transactions
 * - Flexible recurrence rules
 * - Edit/pause/resume
 * - History tracking
 */

exports.up = function (knex) {
  return (
    knex.schema
      .createTable('recurring_transactions', (table) => {
        table.increments('id').primary();
        table.string('name', 100).notNullable(); // Template name
        table.integer('user_id').unsigned().notNullable();
        table.enum('type', ['paket', 'utang', 'jajan']).notNullable();
        table.integer('category_id').unsigned().nullable();
        table.decimal('amount', 15, 2).notNullable();
        table.string('currency', 3).defaultTo('IDR');
        table.text('description').notNullable();

        // Recurrence settings
        table.enum('frequency', ['daily', 'weekly', 'monthly', 'yearly']).notNullable();
        table.integer('interval').defaultTo(1); // Every X days/weeks/months
        table.string('day_of_week', 10).nullable(); // For weekly (monday, tuesday, etc)
        table.integer('day_of_month').nullable(); // For monthly (1-31)
        table.date('start_date').notNullable();
        table.date('end_date').nullable(); // Null = no end
        table.integer('occurrences').nullable(); // Alternative to end_date

        // Status
        table.enum('status', ['active', 'paused', 'completed', 'cancelled']).defaultTo('active');
        table.date('next_run_date').notNullable();
        table.date('last_run_date').nullable();
        table.integer('total_runs').defaultTo(0);

        // Notifications
        table.boolean('notify_before').defaultTo(true);
        table.integer('notify_days_before').defaultTo(1);

        // Metadata
        table.text('metadata').nullable(); // JSON
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Foreign keys
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('category_id').references('id').inTable('categories').onDelete('SET NULL');

        // Indexes
        table.index('user_id');
        table.index(['status', 'next_run_date']);
        table.index('next_run_date');
      })
      // Track created transactions
      .createTable('recurring_transaction_history', (table) => {
        table.increments('id').primary();
        table.integer('recurring_transaction_id').unsigned().notNullable();
        table.integer('transaction_id').unsigned().notNullable();
        table.date('scheduled_date').notNullable();
        table.date('created_date').notNullable();
        table.enum('status', ['success', 'failed', 'skipped']).notNullable();
        table.text('notes').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());

        // Foreign keys
        table
          .foreign('recurring_transaction_id')
          .references('id')
          .inTable('recurring_transactions')
          .onDelete('CASCADE');
        table
          .foreign('transaction_id')
          .references('id')
          .inTable('transactions')
          .onDelete('CASCADE');

        // Indexes
        table.index('recurring_transaction_id');
        table.index('scheduled_date');
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('recurring_transaction_history')
    .dropTableIfExists('recurring_transactions');
};
