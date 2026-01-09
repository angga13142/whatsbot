// File: src/database/seeds/001_default_superadmin.js

require('dotenv').config();
const bcrypt = require('bcrypt');

exports.seed = async function (knex) {
  const phone = process.env.SUPERADMIN_PHONE;
  const pin = process.env.SUPERADMIN_PIN;
  const name = process.env.SUPERADMIN_NAME || 'Superadmin';

  if (!phone || !pin) {
    console.warn('⚠️ SKIPPING SEED: SUPERADMIN_PHONE or SUPERADMIN_PIN not set in .env');
    return;
  }

  // 1. Check existing superadmin
  const existingUser = await knex('users').where({ phone_number: phone }).first();

  // 2. Hash PIN
  const hashedPin = await bcrypt.hash(pin, 10);

  if (existingUser) {
    // Update existing
    await knex('users').where({ phone_number: phone }).update({
      role: 'superadmin',
      status: 'active',
      pin: hashedPin,
      full_name: name,
      updated_at: knex.fn.now(),
    });
    console.log(`✅ Updated existing superadmin: ${name} (${phone})`);
  } else {
    // 3. Insert new
    await knex('users').insert({
      phone_number: phone,
      full_name: name,
      role: 'superadmin',
      status: 'active',
      pin: hashedPin,
      created_by: null,
    });
    console.log(`✅ Created default superadmin: ${name} (${phone})`);
  }
};
