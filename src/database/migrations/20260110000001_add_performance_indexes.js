/**
 * Add Performance Indexes
 *
 * Critical indexes to improve query performance
 * Targets high-traffic queries identified in optimization review
 */

exports.up = function (knex) {
  return (
    // Users - for authentication lookups
    // Recurring transactions - for automation
    // Tags - for filtering
    // Categories - for lookups
    // Scheduled reports - for cron job processing
    // Report executions - for history queries
    // Custom reports - for permission checks
    // Audit logs - frequently queried for security
    // Transactions table - most queried
    knex.schema.raw(`
      -- Composite index for date range queries with status filter
      CREATE INDEX IF NOT EXISTS idx_transactions_user_date_status
      ON transactions(user_id, transaction_date, status);
    `).raw(`
      -- Index for type-based queries with date sorting
      CREATE INDEX IF NOT EXISTS idx_transactions_type_date
      ON transactions(type, transaction_date DESC);
    `).raw(`
      -- Index for status filtering (approve workflow)
      CREATE INDEX IF NOT EXISTS idx_transactions_status_date
      ON transactions(status, transaction_date DESC);
    `).raw(`
      -- Index for category analysis
      CREATE INDEX IF NOT EXISTS idx_transactions_category_date
      ON transactions(category_id, transaction_date);
    `).raw(`
      -- Index for amount-based queries (reports, anomaly detection)
      CREATE INDEX IF NOT EXISTS idx_transactions_amount
      ON transactions(amount);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_audit_user_action_date
      ON audit_logs(user_id, action, created_at DESC);
    `).raw(`
      -- Fixed: using entity_type/entity_id as defined in schema instead of target_type/target_id
      CREATE INDEX IF NOT EXISTS idx_audit_target
      ON audit_logs(entity_type, entity_id);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_reports_created_by
      ON custom_reports(created_by, created_at DESC);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_reports_visibility
      ON custom_reports(visibility, is_template);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_report_exec_report_date
      ON report_executions(report_id, started_at DESC);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_report_exec_user
      ON report_executions(executed_by, started_at DESC);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_status_next_run
      ON scheduled_reports(status, next_run_date);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_categories_parent
      ON categories(parent_id);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_tags_name
      ON tags(name);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_transaction_tags_both
      ON transaction_tags(transaction_id, tag_id);
    `).raw(`
      -- Fixed: using next_run_date instead of next_date
      -- Fixed: using status instead of is_active
      CREATE INDEX IF NOT EXISTS idx_recurring_next_date
      ON recurring_transactions(next_run_date, status);
    `).raw(`
      -- Fixed: using user_id instead of created_by
      CREATE INDEX IF NOT EXISTS idx_recurring_user
      ON recurring_transactions(user_id);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_users_phone
      ON users(phone_number);
    `).raw(`
      CREATE INDEX IF NOT EXISTS idx_users_role
      ON users(role);
    `)
  );
};

exports.down = function (knex) {
  return (
    knex.schema
      // Drop all indexes in reverse order
      .raw('DROP INDEX IF EXISTS idx_users_role')
      .raw('DROP INDEX IF EXISTS idx_users_phone')
      .raw('DROP INDEX IF EXISTS idx_recurring_user')
      .raw('DROP INDEX IF EXISTS idx_recurring_next_date')
      .raw('DROP INDEX IF EXISTS idx_transaction_tags_both')
      .raw('DROP INDEX IF EXISTS idx_tags_name')
      .raw('DROP INDEX IF EXISTS idx_categories_parent')
      .raw('DROP INDEX IF EXISTS idx_scheduled_status_next_run')
      .raw('DROP INDEX IF EXISTS idx_report_exec_user')
      .raw('DROP INDEX IF EXISTS idx_report_exec_report_date')
      .raw('DROP INDEX IF EXISTS idx_reports_visibility')
      .raw('DROP INDEX IF EXISTS idx_reports_created_by')
      .raw('DROP INDEX IF EXISTS idx_audit_target')
      .raw('DROP INDEX IF EXISTS idx_audit_user_action_date')
      .raw('DROP INDEX IF EXISTS idx_transactions_amount')
      .raw('DROP INDEX IF EXISTS idx_transactions_category_date')
      .raw('DROP INDEX IF EXISTS idx_transactions_status_date')
      .raw('DROP INDEX IF EXISTS idx_transactions_type_date')
      .raw('DROP INDEX IF EXISTS idx_transactions_user_date_status')
  );
};
