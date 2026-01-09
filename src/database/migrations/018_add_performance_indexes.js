/**
 * Add Performance Indexes
 *
 * Optimize query performance with strategic indexes
 */

exports.up = async function (knex) {
  // Helper to check if index exists
  const indexExists = async (tableName, indexName) => {
    const result = await knex.raw(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`, [
      indexName,
    ]);
    return result.length > 0;
  };

  // Transactions indexes
  if (!(await indexExists('transactions', 'idx_trans_user_date'))) {
    await knex.schema.table('transactions', (table) => {
      table.index(['user_id', 'transaction_date'], 'idx_trans_user_date');
    });
  }
  if (!(await indexExists('transactions', 'idx_trans_type_status'))) {
    await knex.schema.table('transactions', (table) => {
      table.index(['type', 'status'], 'idx_trans_type_status');
    });
  }
  if (!(await indexExists('transactions', 'idx_trans_date'))) {
    await knex.schema.table('transactions', (table) => {
      table.index(['transaction_date'], 'idx_trans_date');
    });
  }
  if (!(await indexExists('transactions', 'idx_trans_status'))) {
    await knex.schema.table('transactions', (table) => {
      table.index(['status'], 'idx_trans_status');
    });
  }

  // Users indexes
  if (!(await indexExists('users', 'idx_users_status'))) {
    await knex.schema.table('users', (table) => {
      table.index(['status'], 'idx_users_status');
    });
  }
  if (!(await indexExists('users', 'idx_users_created'))) {
    await knex.schema.table('users', (table) => {
      table.index(['created_at'], 'idx_users_created');
    });
  }

  // Customers indexes
  if (!(await indexExists('customers', 'idx_customers_code'))) {
    await knex.schema.table('customers', (table) => {
      table.index(['customer_code'], 'idx_customers_code');
    });
  }
  if (!(await indexExists('customers', 'idx_customers_status'))) {
    await knex.schema.table('customers', (table) => {
      table.index(['status'], 'idx_customers_status');
    });
  }

  // Invoices indexes
  if (!(await indexExists('invoices', 'idx_invoices_customer_status'))) {
    await knex.schema.table('invoices', (table) => {
      table.index(['customer_id', 'status'], 'idx_invoices_customer_status');
    });
  }
  if (!(await indexExists('invoices', 'idx_invoices_date'))) {
    await knex.schema.table('invoices', (table) => {
      table.index(['invoice_date'], 'idx_invoices_date');
    });
  }
  if (!(await indexExists('invoices', 'idx_invoices_due_date'))) {
    await knex.schema.table('invoices', (table) => {
      table.index(['due_date'], 'idx_invoices_due_date');
    });
  }
  if (!(await indexExists('invoices', 'idx_invoices_status'))) {
    await knex.schema.table('invoices', (table) => {
      table.index(['status'], 'idx_invoices_status');
    });
  }

  // Notifications indexes
  if (!(await indexExists('notifications', 'idx_notif_recipient'))) {
    await knex.schema.table('notifications', (table) => {
      table.index(['recipient_id', 'recipient_type'], 'idx_notif_recipient');
    });
  }
  if (!(await indexExists('notifications', 'idx_notif_status'))) {
    await knex.schema.table('notifications', (table) => {
      table.index(['status'], 'idx_notif_status');
    });
  }

  console.log('✅ Performance indexes created');
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.table('transactions', (table) => {
      table.dropIndex([], 'idx_trans_user_date');
      table.dropIndex([], 'idx_trans_type_status');
      table.dropIndex([], 'idx_trans_date');
      table.dropIndex([], 'idx_trans_status');
      table.dropIndex([], 'idx_trans_category');
    }),
    knex.schema.table('users', (table) => {
      table.dropIndex([], 'idx_users_role');
      table.dropIndex([], 'idx_users_status');
      table.dropIndex([], 'idx_users_created');
    }),
    knex.schema.table('customers', (table) => {
      table.dropIndex([], 'idx_customers_code');
      table.dropIndex([], 'idx_customers_status');
      table.dropIndex([], 'idx_customers_created');
    }),
    knex.schema.table('invoices', (table) => {
      table.dropIndex([], 'idx_invoices_customer_status');
      table.dropIndex([], 'idx_invoices_date');
      table.dropIndex([], 'idx_invoices_due_date');
      table.dropIndex([], 'idx_invoices_status');
    }),
    knex.schema.table('notifications', (table) => {
      table.dropIndex([], 'idx_notif_recipient');
      table.dropIndex([], 'idx_notif_status');
      table.dropIndex([], 'idx_notif_created');
    }),
  ]);
};
