/**
 * Create Notifications Table
 *
 * Track all notifications sent to customers and users
 */

exports.up = function (knex) {
  return knex.schema
    .createTable('notifications', (table) => {
      // Primary key
      table.increments('id').primary();

      // Recipient
      table.string('recipient_type', 50).notNullable().comment('customer, user, admin');
      table.integer('recipient_id').notNullable().comment('customer_id or user_id');
      table.string('recipient_name', 200);
      table.string('recipient_contact', 200).comment('Email or phone number');

      // Notification details
      table
        .string('notification_type', 100)
        .notNullable()
        .comment('invoice_sent, payment_reminder, transaction_alert, etc.');
      table.string('channel', 50).notNullable().comment('whatsapp, email, sms, push');
      table.string('priority', 20).defaultTo('normal').comment('low, normal, high, urgent');

      // Content
      table.string('subject', 500);
      table.text('message').notNullable();
      table.json('data').comment('Additional structured data');
      table.string('template_name', 100);

      // Related entities
      table.string('related_type', 50).comment('invoice, transaction, customer, etc.');
      table.integer('related_id').comment('ID of related entity');

      // Delivery status
      table
        .string('status', 50)
        .defaultTo('pending')
        .comment('pending, sent, delivered, failed, read');
      table.timestamp('scheduled_at').comment('For scheduled notifications');
      table.timestamp('sent_at');
      table.timestamp('delivered_at');
      table.timestamp('read_at');
      table.timestamp('failed_at');

      // Failure tracking
      table.integer('retry_count').defaultTo(0);
      table.integer('max_retries').defaultTo(3);
      table.text('error_message');
      table.json('error_details');

      // External service tracking
      table.string('external_id', 200).comment('ID from WhatsApp/Email service');
      table.json('external_response');

      // User interaction
      table.boolean('requires_action').defaultTo(false);
      table.string('action_url', 500);
      table.string('action_text', 200);
      table.timestamp('action_taken_at');

      // Metadata
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.json('metadata');

      // Timestamps
      table.timestamps(true, true);

      // Indexes
      table.index('recipient_type');
      table.index('recipient_id');
      table.index(['recipient_type', 'recipient_id']);
      table.index('notification_type');
      table.index('channel');
      table.index('status');
      table.index('scheduled_at');
      table.index('created_at');
      table.index(['related_type', 'related_id']);
    })
    .then(() => {
      console.log('✅ Notifications table created');
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notifications');
};
