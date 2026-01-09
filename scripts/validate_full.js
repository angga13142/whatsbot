const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../src/config/app');
const db = require('../src/database/connection');
const logger = require('../src/utils/logger');

const RESULTS = {
  files: { passed: 0, total: 0, missing: [] },
  database: {},
  utilities: {},
  services: {},
};

async function runValidation() {
  console.log('🔍 Starting Phase 1 Validation...\n');

  // --- 1. File Existence ---
  console.log('📂 Checking Files...');
  const filesToCheck = [
    'package.json',
    '.env.example',
    '.eslintrc.js',
    '.prettierrc.json',
    '.gitignore',
    'jest.config.js',
    'ecosystem.config.js',
    'src/database/connection.js',
    'src/database/repositories/userRepository.js',
    'src/database/repositories/transactionRepository.js',
    'src/database/repositories/auditRepository.js',
    'src/utils/logger.js',
    'src/utils/formatter.js',
    'src/utils/validator.js',
    'src/utils/parser.js',
    'src/utils/richText.js',
    'src/utils/constants.js',
    'src/utils/sessionManager.js',
    'src/config/database.js',
    'src/config/whatsapp.js',
    'src/config/app.js',
    'src/bot/client.js',
    'src/bot/handlers/messageHandler.js',
    'src/bot/handlers/eventHandler.js',
    'src/bot/middleware/authMiddleware.js',
    'src/bot/middleware/rateLimitMiddleware.js',
    'src/services/userService.js',
    'src/services/transactionService.js',
    'src/services/reportService.js',
    'src/services/notificationService.js',
    'src/commands/index.js',
    'src/commands/common/startCommand.js',
    'src/commands/common/helpCommand.js',
    'src/commands/common/statusCommand.js',
    'src/commands/karyawan/catatCommand.js',
    'src/commands/karyawan/laporanCommand.js',
    'src/commands/karyawan/historyCommand.js',
    'src/commands/bos/addKaryawanCommand.js',
    'src/commands/bos/approveCommand.js',
    'src/commands/flows/conversationFlow.js',
    'src/templates/messages/welcomeTemplate.js',
    'src/templates/messages/transactionTemplate.js',
    'src/templates/messages/reportTemplate.js',
    'src/templates/messages/errorTemplate.js',
    'src/schedulers/dailyReportScheduler.js',
    'src/schedulers/backupScheduler.js',
    'src/app.js',
  ];

  for (const file of filesToCheck) {
    if (fs.existsSync(file)) {
      RESULTS.files.passed++;
    } else {
      RESULTS.files.missing.push(file);
    }
  }
  RESULTS.files.total = filesToCheck.length;
  console.log(`   Files found: ${RESULTS.files.passed}/${RESULTS.files.total}`);
  if (RESULTS.files.missing.length > 0) console.log('   Missing:', RESULTS.files.missing);

  // --- 2. Database ---
  console.log('\n🗄️  Checking Database...');
  try {
    await db.raw('SELECT 1');
    console.log('   ✅ Connection: OK');
    RESULTS.database.connection = true;

    // Check Tables
    const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map((t) => t.name);
    console.log('   Tables found:', tableNames.join(', '));
    RESULTS.database.tables = [
      'users',
      'transactions',
      'audit_logs',
      'bot_sessions',
      'knex_migrations',
    ].every((t) => tableNames.includes(t));

    // Check Superadmin
    const superadmin = await db('users').where({ role: 'superadmin' }).first();
    console.log('   ✅ Superadmin found:', superadmin ? 'Yes' : 'No');
    RESULTS.database.superadmin = !!superadmin;
  } catch (err) {
    console.error('   ❌ Database Error:', err.message);
    RESULTS.database.error = err.message;
  }

  // --- 3. Utilities ---
  console.log('\n🛠️  Checking Utilities...');
  const formatter = require('../src/utils/formatter');
  const parser = require('../src/utils/parser');

  const currencyTest = formatter.formatCurrency(1000000);
  console.log(`   Format Currency: ${currencyTest === 'Rp 1.000.000' ? '✅' : '❌'}`);

  const parseTest = parser.parseNaturalAmount('250rb');
  console.log(`   Parse Amount: ${parseTest.amount === 250000 ? '✅' : '❌'}`);

  // --- 4. App Config ---
  console.log('\n⚙️  Checking Config...');
  console.log(`   App Name: ${config.app.name}`);
  console.log(`   Env: ${config.app.environment}`);

  console.log('\n--- Validation Summary ---');
  console.log(JSON.stringify(RESULTS, null, 2));

  process.exit(0);
}

runValidation();
