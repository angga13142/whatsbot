/**
 * Add file attachments support
 *
 * Features:
 * - Multiple files per transaction
 * - Images, PDFs, documents
 * - Cloud storage integration
 * - Thumbnails for images
 */

exports.up = async function (knex) {
  // Create attachments table
  await knex.schema.createTable('attachments', (table) => {
    table.increments('id').primary();
    table.integer('transaction_id').unsigned().notNullable();
    table.string('file_name', 255).notNullable();
    table.string('file_type', 50).notNullable(); // mime type
    table.integer('file_size').notNullable(); // bytes
    table.string('storage_path', 500).notNullable(); // local or cloud path
    table.string('storage_type', 20).defaultTo('local'); // local, s3, gcs
    table.string('thumbnail_path', 500).nullable(); // For images
    table.string('file_hash', 64).nullable(); // SHA-256 for deduplication
    table.text('metadata').nullable(); // JSON: Dimensions, EXIF, etc.
    table.integer('uploaded_by').unsigned().notNullable();
    table.timestamp('uploaded_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('transaction_id').references('id').inTable('transactions').onDelete('CASCADE');
    table.foreign('uploaded_by').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index('transaction_id');
    table.index('file_hash'); // For deduplication
    table.index('uploaded_at');
  });

  // Check if image_url column exists before renaming
  const hasImageUrl = await knex.schema.hasColumn('transactions', 'image_url');
  if (hasImageUrl) {
    await knex.schema.table('transactions', (table) => {
      table.renameColumn('image_url', 'legacy_image_url');
    });
  }
};

exports.down = async function (knex) {
  // Check if legacy_image_url exists before renaming back
  const hasLegacy = await knex.schema.hasColumn('transactions', 'legacy_image_url');
  if (hasLegacy) {
    await knex.schema.table('transactions', (table) => {
      table.renameColumn('legacy_image_url', 'image_url');
    });
  }

  await knex.schema.dropTableIfExists('attachments');
};
