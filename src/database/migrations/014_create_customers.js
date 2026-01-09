/**
 * Create Customers Table
 *
 * Stores customer information for invoicing and tracking
 */

exports.up = function (knex) {
  return knex.schema
    .createTable('customers', (table) => {
      // Primary key
      table.increments('id').primary();

      // Basic information
      table
        .string('customer_code', 50)
        .notNullable()
        .unique()
        .comment('Unique customer code (e.g., CUST-001)');
      table.string('customer_name', 200).notNullable();
      table.string('email', 200);
      table.string('phone_number', 50);
      table.string('whatsapp_number', 50);

      // Address
      table.text('address');
      table.string('city', 100);
      table.string('province', 100);
      table.string('postal_code', 20);
      table.string('country', 100).defaultTo('Indonesia');

      // Business information
      table.string('company_name', 200);
      table.string('tax_id', 100).comment('NPWP or tax identification');
      table.string('business_type', 100);

      // Financial settings
      table.decimal('credit_limit', 15, 2).defaultTo(0).comment('Maximum credit allowed');
      table.decimal('current_balance', 15, 2).defaultTo(0).comment('Current outstanding balance');
      table.integer('payment_term_days').defaultTo(30).comment('Payment terms in days');
      table.string('payment_method', 50).comment('Preferred payment method');

      // Customer classification
      table
        .string('customer_type', 50)
        .defaultTo('regular')
        .comment('VIP, Regular, Wholesale, etc.');
      table.string('customer_category', 100);
      table.integer('priority_level').defaultTo(5).comment('1=Highest, 10=Lowest');

      // Status
      table
        .string('status', 20)
        .defaultTo('active')
        .comment('active, inactive, suspended, blocked');
      table.text('status_reason').comment('Reason for status change');

      // Discount and pricing
      table.decimal('discount_percentage', 5, 2).defaultTo(0);
      table.string('price_tier', 50).comment('Custom pricing tier');

      // Relationships
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table
        .integer('assigned_to')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .comment('Account manager');

      // Metadata
      table.text('notes');
      table.json('metadata').comment('Additional custom fields');
      table.json('tags');

      // Statistics (denormalized for performance)
      table.integer('total_transactions').defaultTo(0);
      table.decimal('total_revenue', 15, 2).defaultTo(0);
      table.decimal('lifetime_value', 15, 2).defaultTo(0);
      table.date('first_transaction_date');
      table.date('last_transaction_date');
      table.integer('days_since_last_transaction');

      // Timestamps
      table.timestamps(true, true);
      table.timestamp('deleted_at').nullable();

      // Indexes
      table.index('customer_code');
      table.index('customer_name');
      table.index('email');
      table.index('phone_number');
      table.index('whatsapp_number');
      table.index('status');
      table.index('customer_type');
      table.index('created_by');
      table.index('assigned_to');
    })
    .then(() => {
      console.log('✅ Customers table created');
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customers');
};
