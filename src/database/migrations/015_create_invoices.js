/**
 * Create Invoices Table
 *
 * Professional invoicing system for customer billing
 */

exports.up = function (knex) {
  return knex.schema
    .createTable('invoices', (table) => {
      // Primary key
      table.increments('id').primary();

      // Invoice identification
      table.string('invoice_number', 100).notNullable().unique().comment('e.g., INV-2026-001');
      table
        .string('invoice_type', 50)
        .defaultTo('standard')
        .comment('standard, proforma, credit_note, debit_note');
      table
        .integer('parent_invoice_id')
        .unsigned()
        .references('id')
        .inTable('invoices')
        .onDelete('SET NULL')
        .comment('For credit/debit notes');

      // Customer reference
      table
        .integer('customer_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('RESTRICT');
      table.string('customer_name', 200).notNullable().comment('Snapshot at invoice time');
      table.text('customer_address');
      table.string('customer_email', 200);
      table.string('customer_phone', 50);
      table.string('customer_tax_id', 100);

      // Dates
      table.date('invoice_date').notNullable();
      table.date('due_date').notNullable();
      table.date('paid_date').nullable();
      table.integer('payment_term_days').defaultTo(30);

      // Amounts
      table.decimal('subtotal', 15, 2).notNullable().defaultTo(0);
      table.decimal('discount_amount', 15, 2).defaultTo(0);
      table.decimal('discount_percentage', 5, 2).defaultTo(0);
      table.decimal('tax_amount', 15, 2).defaultTo(0);
      table.decimal('tax_percentage', 5, 2).defaultTo(11).comment('PPN 11%');
      table.decimal('other_charges', 15, 2).defaultTo(0);
      table.decimal('total_amount', 15, 2).notNullable();
      table.decimal('paid_amount', 15, 2).defaultTo(0);
      table.decimal('outstanding_amount', 15, 2).notNullable();

      // Currency
      table.string('currency', 10).defaultTo('IDR');
      table.decimal('exchange_rate', 15, 6).defaultTo(1);
      table.decimal('total_amount_idr', 15, 2).comment('Always store IDR equivalent');

      // Status
      table
        .string('status', 50)
        .defaultTo('draft')
        .comment('draft, sent, viewed, partial, paid, overdue, cancelled, void');
      table.timestamp('sent_at').nullable();
      table.timestamp('viewed_at').nullable();
      table.integer('view_count').defaultTo(0);

      // Payment information
      table.string('payment_method', 50);
      table.string('payment_reference', 200).comment('Bank transfer reference, etc.');
      table.text('payment_notes');

      // Invoice content
      table.json('line_items').notNullable().comment('Array of invoice line items');
      table.text('notes').comment('Notes to customer');
      table.text('terms_and_conditions');
      table.text('footer_text');

      // File attachments
      table.string('pdf_file_path', 500);
      table.integer('pdf_file_size');
      table.timestamp('pdf_generated_at');

      // Delivery tracking
      table.boolean('sent_via_email').defaultTo(false);
      table.boolean('sent_via_whatsapp').defaultTo(false);
      table.timestamp('email_sent_at');
      table.timestamp('whatsapp_sent_at');
      table.integer('reminder_count').defaultTo(0);
      table.timestamp('last_reminder_at');

      // Relationships
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table
        .integer('approved_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.timestamp('approved_at');

      // Metadata
      table.text('internal_notes').comment('Internal notes, not shown to customer');
      table.json('metadata');
      table.json('audit_trail').comment('Track all status changes');

      // Timestamps
      table.timestamps(true, true);
      table.timestamp('deleted_at').nullable();

      // Indexes
      table.index('invoice_number');
      table.index('customer_id');
      table.index('invoice_date');
      table.index('due_date');
      table.index('status');
      table.index('invoice_type');
      table.index(['customer_id', 'status']);
      table.index(['due_date', 'status']);
    })
    .then(() => {
      console.log('✅ Invoices table created');
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('invoices');
};
