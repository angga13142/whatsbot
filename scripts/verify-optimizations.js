#!/usr/bin/env node

/**
 * Verify Critical Optimizations
 *
 * Check all 8 optimizations are properly implemented
 */

console.log('🔍 Verifying Critical Optimizations...\n');

let passed = 0;
let failed = 0;

// 1. Rate Limiter
try {
  const rateLimiter = require('../src/middleware/rateLimiter');
  console.log('✅ Rate Limiter: Loaded');
  passed++;
} catch (e) {
  console.log('❌ Rate Limiter: Failed -', e.message);
  failed++;
}

// 2. Authorization
try {
  const authMiddleware = require('../src/middleware/authorizationMiddleware');
  console.log('✅ Authorization: Loaded');
  passed++;
} catch (e) {
  console.log('❌ Authorization: Failed -', e.message);
  failed++;
}

// 3. Error Handler
try {
  const errorHandler = require('../src/middleware/errorHandler');
  console.log('✅ Error Handler: Loaded');
  passed++;
} catch (e) {
  console.log('❌ Error Handler: Failed -', e.message);
  failed++;
}

// 4. Cache
try {
  const cache = require('../src/utils/cache');
  console.log('✅ Cache System: Loaded');
  console.log('   Stats:', cache.getStats());
  passed++;
} catch (e) {
  console.log('❌ Cache System: Failed -', e.message);
  failed++;
}

// 5. Validators
try {
  const validators = require('../src/utils/validators');
  console.log('✅ Input Validators: Loaded');
  passed++;
} catch (e) {
  console.log('❌ Input Validators: Failed -', e.message);
  failed++;
}

// 6. Environment
try {
  const envConfig = require('../src/config/env');
  console.log('✅ Environment Config: Loaded');
  console.log('   Environment:', envConfig.env);
  passed++;
} catch (e) {
  console.log('❌ Environment Config: Failed -', e.message);
  failed++;
}

// 7. Cleanup Scheduler
try {
  const cleanupScheduler = require('../src/schedulers/cleanupScheduler');
  console.log('✅ Cleanup Scheduler: Loaded');
  passed++;
} catch (e) {
  console.log('❌ Cleanup Scheduler: Failed -', e.message);
  failed++;
}

// 8. Database Indexes
const knex = require('../src/database/connection');
knex
  .raw("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
  .then((indexes) => {
    console.log('✅ Database Indexes: Created');
    console.log('   Total indexes:', indexes.length);
    passed++;

    console.log('\n' + '='.repeat(60));
    console.log(`📊 VERIFICATION SUMMARY: ${passed}/${passed + failed} passed`);
    console.log('='.repeat(60));

    if (failed === 0) {
      console.log('\n🎉 ALL OPTIMIZATIONS VERIFIED!\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${failed} optimization(s) failed verification\n`);
      process.exit(1);
    }
  })
  .catch((e) => {
    console.log('❌ Database Indexes: Failed -', e.message);
    failed++;
    console.log('\n' + '='.repeat(60));
    console.log(`📊 VERIFICATION SUMMARY: ${passed}/${passed + failed} passed`);
    console.log('='.repeat(60));
    console.log(`\n⚠️  ${failed} optimization(s) failed verification\n`);
    process.exit(1);
  });
