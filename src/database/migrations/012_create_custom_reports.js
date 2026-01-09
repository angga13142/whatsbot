/**
 * Create custom reports tables
 *
 * Features:
 * - Save custom report configurations
 * - Report templates
 * - Report history/cache
 * - Scheduled reports
 */

exports.up = function (knex) {
  return (
    knex.schema
      // Custom report configurations
      .createTable('custom_reports', (table) => {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.text('description').nullable();
        table.integer('created_by').unsigned().notNullable();

        // Report configuration (JSON)
        table.jsonb('config').notNullable(); // filters, grouping, calculations

        // Metadata
        table
          .enum('report_type', ['standard', 'comparison', 'trend', 'summary'])
          .defaultTo('standard');
        table.enum('visibility', ['private', 'shared', 'public']).defaultTo('private');
        table.boolean('is_template').defaultTo(false);
        table.boolean('is_favorite').defaultTo(false);

        // Usage tracking
        table.integer('usage_count').defaultTo(0);
        table.timestamp('last_used_at').nullable();

        // Timestamps
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Foreign keys
        table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');

        // Indexes
        table.index('created_by');
        table.index(['created_by', 'is_favorite']);
        table.index('is_template');
      })

      // Report execution history/cache
      .createTable('report_executions', (table) => {
        table.increments('id').primary();
        table.integer('report_id').unsigned().nullable(); // null for ad-hoc reports
        table.integer('executed_by').unsigned().notNullable();

        // Execution details
        table.jsonb('filters').notNullable(); // Actual filters used
        table.jsonb('results_summary').nullable(); // Cached summary
        table.integer('result_count').defaultTo(0);

        // Performance tracking
        table.integer('execution_time_ms').nullable();
        table.string('export_format', 20).nullable(); // excel, csv, pdf, json
        table.text('export_path').nullable();

        // Status
        table.enum('status', ['pending', 'running', 'completed', 'failed']).defaultTo('pending');
        table.text('error_message').nullable();

        // Timestamps
        table.timestamp('started_at').defaultTo(knex.fn.now());
        table.timestamp('completed_at').nullable();

        // Foreign keys
        table.foreign('report_id').references('id').inTable('custom_reports').onDelete('SET NULL');
        table.foreign('executed_by').references('id').inTable('users').onDelete('CASCADE');

        // Indexes
        table.index('report_id');
        table.index('executed_by');
        table.index(['executed_by', 'completed_at']);
      })

      // Scheduled reports
      .createTable('scheduled_reports', (table) => {
        table.increments('id').primary();
        table.integer('report_id').unsigned().notNullable();
        table.integer('created_by').unsigned().notNullable();

        // Schedule configuration
        table.enum('frequency', ['daily', 'weekly', 'monthly']).notNullable();
        table.string('day_of_week', 10).nullable(); // For weekly
        table.integer('day_of_month').nullable(); // For monthly
        table.time('time_of_day').defaultTo('09:00:00');

        // Delivery configuration
        table.jsonb('recipients').notNullable(); // Array of user IDs or phone numbers
        table.enum('delivery_method', ['whatsapp', 'email', 'both']).defaultTo('whatsapp');
        table.string('export_format', 20).defaultTo('excel');

        // Status
        table.enum('status', ['active', 'paused', 'cancelled']).defaultTo('active');
        table.date('next_run_date').notNullable();
        table.date('last_run_date').nullable();
        table.integer('total_runs').defaultTo(0);

        // Timestamps
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Foreign keys
        table.foreign('report_id').references('id').inTable('custom_reports').onDelete('CASCADE');
        table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');

        // Indexes
        table.index('report_id');
        table.index(['status', 'next_run_date']);
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('scheduled_reports')
    .dropTableIfExists('report_executions')
    .dropTableIfExists('custom_reports');
};
