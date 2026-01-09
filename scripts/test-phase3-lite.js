#!/usr/bin/env node

/**
 * Phase 3 Lite Test Runner
 *
 * Automated testing for Customer Portal & Invoicing System
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function testHeader(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function testResult(name, passed, error = null) {
  results.total++;
  if (passed) {
    results.passed++;
    log(`✅ ${name}`, 'green');
  } else {
    results.failed++;
    log(`❌ ${name}`, 'red');
    if (error) {
      log(`   Error: ${error}`, 'red');
    }
  }
  results.tests.push({ name, passed, error });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// PRE-TESTING SETUP
// ============================================================================

async function testSetup() {
  testHeader('🔧 PRE-TESTING SETUP');

  // Test 0.1: Create directories
  try {
    const invoiceDir = path.join(__dirname, '../storage/invoices');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }
    testResult('Create invoice directory', true);
  } catch (error) {
    testResult('Create invoice directory', false, error.message);
  }

  // Test 0.2: Verify tables exist
  try {
    const knex = require('../src/database/connection');
    const tables = await knex.raw(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('customers', 'invoices', 'notifications')"
    );
    const tableCount = tables.length;
    testResult(
      `Verify Phase 3 tables (${tableCount}/3)`,
      tableCount === 3,
      tableCount < 3 ? 'Run migrations first' : null
    );
  } catch (error) {
    testResult('Verify Phase 3 tables', false, error.message);
  }

  // Test 0.3: Verify services load
  try {
    require('../src/services/customerService');
    require('../src/services/invoiceService');
    require('../src/services/notificationService');
    testResult('Load Phase 3 services', true);
  } catch (error) {
    testResult('Load Phase 3 services', false, error.message);
  }
}

// ============================================================================
// TEST 1: CUSTOMER MANAGEMENT
// ============================================================================

let testCustomerId = null;
let testCustomerCode = null;

async function testCustomerManagement() {
  testHeader('👥 TEST 1: CUSTOMER MANAGEMENT');

  const customerService = require('../src/services/customerService');

  // Generate unique phone number for this test run
  const timestamp = Date.now();
  const testPhone = `+628${timestamp.toString().slice(-9)}`;

  // Test 1.1: Create customer
  try {
    const customer = await customerService.createCustomer(
      {
        customer_name: 'Test Customer Phase3',
        email: `phase3test${timestamp}@customer.com`,
        phone_number: testPhone,
        whatsapp_number: testPhone,
        address: 'Jl. Test Phase 3 No. 123',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        credit_limit: 10000000,
        payment_term_days: 30,
        customer_type: 'regular',
      },
      1
    );

    testCustomerId = customer.id;
    testCustomerCode = customer.customer_code;

    log(`   Customer ID: ${customer.id}`, 'blue');
    log(`   Customer Code: ${customer.customer_code}`, 'blue');
    testResult('Create customer', true);
  } catch (error) {
    testResult('Create customer', false, error.message);
  }

  // Test 1.2: Get customer by phone
  try {
    const customer = await customerService.getCustomerByPhone(testPhone);
    const found = customer && customer.customer_name === 'Test Customer Phase3';
    testResult('Get customer by phone', found, !found ? 'Customer not found' : null);
  } catch (error) {
    testResult('Get customer by phone', false, error.message);
  }

  // Test 1.3: Get customer balance
  try {
    const balance = await customerService.getCustomerBalance(testCustomerId);
    const valid = balance && balance.current_balance === 0 && balance.credit_limit === 10000000;
    if (valid) {
      log(`   Credit Limit: ${balance.credit_limit.toLocaleString()}`, 'blue');
      log(`   Available: ${balance.available_credit.toLocaleString()}`, 'blue');
    }
    testResult('Get customer balance', valid);
  } catch (error) {
    testResult('Get customer balance', false, error.message);
  }

  // Test 1.4: Check credit limit
  try {
    const check1 = await customerService.checkCreditLimit(testCustomerId, 5000000);
    const check2 = await customerService.checkCreditLimit(testCustomerId, 15000000);
    const valid = check1.allowed === true && check2.allowed === false;
    if (valid) {
      log(`   5M allowed: ${check1.allowed}`, 'blue');
      log(`   15M allowed: ${check2.allowed}`, 'blue');
    }
    testResult('Check credit limit', valid);
  } catch (error) {
    testResult('Check credit limit', false, error.message);
  }
}

// ============================================================================
// TEST 2: INVOICE GENERATION
// ============================================================================

let testTransactionIds = [];
let testInvoiceId = null;
let testInvoiceNumber = null;

async function testInvoiceGeneration() {
  testHeader('📄 TEST 2: INVOICE GENERATION');

  const transactionService = require('../src/services/transactionService');
  const invoiceService = require('../src/services/invoiceService');

  // Test 2.1: Create transactions
  try {
    testTransactionIds = [];
    const amounts = [1000000, 1500000, 2000000];
    const knex = require('../src/database/connection');

    for (let i = 0; i < amounts.length; i++) {
      const txn = await transactionService.createTransaction(
        1,
        'paket',
        amounts[i],
        `Test Package Delivery Phase3 #${i + 1}`,
        {
          customer_id: testCustomerId,
        }
      );

      // Approve transaction and set customer_id
      await knex('transactions').where({ id: txn.id }).update({
        status: 'approved',
        customer_id: testCustomerId,
      });

      testTransactionIds.push(txn.id);
    }

    log(`   Created ${testTransactionIds.length} transactions`, 'blue');
    testResult('Create transactions', testTransactionIds.length === 3);
  } catch (error) {
    testResult('Create transactions', false, error.message);
  }

  // Test 2.2: Create invoice
  try {
    const invoice = await invoiceService.createInvoice(
      testCustomerId,
      testTransactionIds,
      {
        tax_percentage: 11,
        discount_percentage: 0,
        notes: 'Test invoice for Phase 3',
      },
      1
    );

    testInvoiceId = invoice.id;
    testInvoiceNumber = invoice.invoice_number;

    const expectedSubtotal = 4500000;
    const expectedTax = 495000;
    const expectedTotal = 4995000;

    const valid =
      invoice.subtotal === expectedSubtotal &&
      invoice.tax_amount === expectedTax &&
      invoice.total_amount === expectedTotal;

    if (valid) {
      log(`   Invoice: ${invoice.invoice_number}`, 'blue');
      log(`   Subtotal: ${invoice.subtotal.toLocaleString()}`, 'blue');
      log(`   Tax: ${invoice.tax_amount.toLocaleString()}`, 'blue');
      log(`   Total: ${invoice.total_amount.toLocaleString()}`, 'blue');
    }

    testResult('Create invoice', valid);
  } catch (error) {
    testResult('Create invoice', false, error.message);
  }

  // Test 2.3: Get invoice by number
  try {
    const invoice = await invoiceService.getInvoiceByNumber(testInvoiceNumber);
    const valid = invoice && invoice.invoice_number === testInvoiceNumber;
    if (valid) {
      log(`   Found invoice: ${invoice.invoice_number}`, 'blue');
    }
    testResult('Get invoice by number', valid);
  } catch (error) {
    testResult('Get invoice by number', false, error.message);
  }

  // Test 2.4: Record payment
  try {
    const paymentAmount = 2000000;
    const updatedInvoice = await invoiceService.recordPayment(testInvoiceId, paymentAmount, {
      payment_method: 'Bank Transfer',
      payment_reference: 'TEST-TRF-001',
    });

    const valid =
      updatedInvoice.paid_amount === paymentAmount &&
      updatedInvoice.outstanding_amount === 2995000 &&
      updatedInvoice.status === 'partial';

    if (valid) {
      log(`   Paid: ${updatedInvoice.paid_amount.toLocaleString()}`, 'blue');
      log(`   Outstanding: ${updatedInvoice.outstanding_amount.toLocaleString()}`, 'blue');
      log(`   Status: ${updatedInvoice.status}`, 'blue');
    }

    testResult('Record payment', valid);
  } catch (error) {
    testResult('Record payment', false, error.message);
  }

  // Test 2.5: Get invoice statistics
  try {
    const stats = await invoiceService.getInvoiceStatistics();
    const valid = stats && stats.total_invoices > 0;
    if (valid) {
      log(`   Total invoices: ${stats.total_invoices}`, 'blue');
      log(`   Total invoiced: ${stats.amounts.total_invoiced.toLocaleString()}`, 'blue');
    }
    testResult('Get invoice statistics', valid);
  } catch (error) {
    testResult('Get invoice statistics', false, error.message);
  }
}

// ============================================================================
// TEST 3: NOTIFICATIONS
// ============================================================================

async function testNotifications() {
  testHeader('🔔 TEST 3: NOTIFICATIONS');

  const notificationService = require('../src/services/notificationService');
  const knex = require('../src/database/connection');

  // Test 3.1: Send invoice notification
  try {
    const invoice = await knex('invoices').where({ id: testInvoiceId }).first();
    const notification = await notificationService.sendInvoiceNotification(invoice);

    const valid =
      notification &&
      notification.notification_type === 'invoice_sent' &&
      notification.channel === 'whatsapp';

    if (valid) {
      log(`   Notification ID: ${notification.id}`, 'blue');
      log(`   Type: ${notification.notification_type}`, 'blue');
    }

    testResult('Send invoice notification', valid);
  } catch (error) {
    testResult('Send invoice notification', false, error.message);
  }

  // Test 3.2: Get customer notifications
  try {
    const notifications = await notificationService.getCustomerNotifications(testCustomerId, {
      limit: 5,
    });
    const valid = Array.isArray(notifications) && notifications.length > 0;
    if (valid) {
      log(`   Notifications: ${notifications.length}`, 'blue');
    }
    testResult('Get customer notifications', valid);
  } catch (error) {
    testResult('Get customer notifications', false, error.message);
  }

  // Test 3.3: Create notification record
  try {
    const knex = require('../src/database/connection');
    const [id] = await knex('notifications').insert({
      recipient_type: 'customer',
      recipient_id: testCustomerId,
      recipient_name: 'Test Customer',
      recipient_contact: '+6281234567890',
      notification_type: 'test_notification',
      channel: 'whatsapp',
      subject: 'Test',
      message: 'Test notification message',
      status: 'pending',
      priority: 'normal',
      created_at: new Date(),
      updated_at: new Date(),
    });

    testResult('Create notification record', id > 0);
  } catch (error) {
    testResult('Create notification record', false, error.message);
  }
}

// ============================================================================
// TEST 4: PDF GENERATION
// ============================================================================

async function testPDFGeneration() {
  testHeader('📄 TEST 4: PDF GENERATION');

  const invoiceTemplate = require('../src/templates/invoices/invoiceTemplate');
  const knex = require('../src/database/connection');

  // Test 4.1: Generate invoice PDF
  try {
    const invoice = await knex('invoices').where({ id: testInvoiceId }).first();

    if (!invoice) {
      testResult('Generate invoice PDF', false, 'Invoice not found');
      return;
    }

    // Don't parse - template will handle it
    const pdfPath = await invoiceTemplate.generatePDF(invoice);

    const exists = fs.existsSync(pdfPath);
    const stats = exists ? fs.statSync(pdfPath) : null;
    const valid = exists && stats.size > 1000;

    if (valid) {
      log(`   PDF: ${pdfPath}`, 'blue');
      log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`, 'blue');
    }

    testResult(
      'Generate invoice PDF',
      valid,
      !exists ? 'PDF file not created' : stats.size < 1000 ? 'PDF too small' : null
    );
  } catch (error) {
    testResult('Generate invoice PDF', false, error.message);
  }
}

// ============================================================================
// TEST 5: CUSTOMER REPOSITORY
// ============================================================================

async function testCustomerRepository() {
  testHeader('📊 TEST 5: CUSTOMER REPOSITORY');

  const customerRepository = require('../src/database/repositories/customerRepository');

  // Test 5.1: Generate customer code
  try {
    const code = await customerRepository.generateCustomerCode();
    const valid = code && code.startsWith('CUST-');
    if (valid) {
      log(`   Generated code: ${code}`, 'blue');
    }
    testResult('Generate customer code', valid);
  } catch (error) {
    testResult('Generate customer code', false, error.message);
  }

  // Test 5.2: Get customer summary
  try {
    const summary = await customerRepository.getCustomerSummary(testCustomerId);
    const valid = summary && summary.customer && summary.transactions && summary.invoices;
    if (valid) {
      log(`   Transactions: ${summary.transactions.total_count}`, 'blue');
      log(`   Invoices: ${summary.invoices.total_invoices}`, 'blue');
    }
    testResult('Get customer summary', valid);
  } catch (error) {
    testResult('Get customer summary', false, error.message);
  }

  // Test 5.3: Update customer statistics
  try {
    await customerRepository.updateCustomerStatistics(testCustomerId);
    const customer = await customerRepository.getCustomerById(testCustomerId);
    const valid = customer.total_transactions >= 3;
    testResult('Update customer statistics', valid);
  } catch (error) {
    testResult('Update customer statistics', false, error.message);
  }
}

// ============================================================================
// TEST 6: INVOICE REPOSITORY
// ============================================================================

async function testInvoiceRepository() {
  testHeader('📋 TEST 6: INVOICE REPOSITORY');

  const invoiceRepository = require('../src/database/repositories/invoiceRepository');

  // Test 6.1: Generate invoice number
  try {
    const invoiceNumber = await invoiceRepository.generateInvoiceNumber();
    const valid = invoiceNumber && /^INV-\d{6}-\d{4}$/.test(invoiceNumber);
    if (valid) {
      log(`   Generated: ${invoiceNumber}`, 'blue');
    }
    testResult('Generate invoice number', valid);
  } catch (error) {
    testResult('Generate invoice number', false, error.message);
  }

  // Test 6.2: Get all invoices
  try {
    const invoices = await invoiceRepository.getAllInvoices({ limit: 10 });
    const valid = Array.isArray(invoices);
    if (valid) {
      log(`   Found ${invoices.length} invoices`, 'blue');
    }
    testResult('Get all invoices', valid);
  } catch (error) {
    testResult('Get all invoices', false, error.message);
  }

  // Test 6.3: Mark invoice as viewed
  try {
    const invoice = await invoiceRepository.markAsViewed(testInvoiceId);
    const valid = invoice && invoice.view_count > 0;
    testResult('Mark invoice as viewed', valid);
  } catch (error) {
    testResult('Mark invoice as viewed', false, error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.clear();

  log('╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                          ║', 'cyan');
  log('║     PHASE 3 LITE - AUTOMATED TEST RUNNER                ║', 'cyan');
  log('║                                                          ║', 'cyan');
  log('║     Customer Portal & Invoicing System                  ║', 'cyan');
  log('║                                                          ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝', 'cyan');

  try {
    await testSetup();
    await testCustomerManagement();
    await testInvoiceGeneration();
    await testNotifications();
    await testPDFGeneration();
    await testCustomerRepository();
    await testInvoiceRepository();

    // Print summary
    testHeader('📊 TEST SUMMARY');

    console.log();
    log(`Total Tests: ${results.total}`, 'cyan');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    console.log();

    const passRate = ((results.passed / results.total) * 100).toFixed(1);
    log(`Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');

    if (results.failed === 0) {
      console.log();
      log('╔══════════════════════════════════════════════════════════╗', 'green');
      log('║                                                          ║', 'green');
      log('║     🎉 ALL TESTS PASSED!                                 ║', 'green');
      log('║                                                          ║', 'green');
      log('║     Phase 3 Lite is fully functional!                   ║', 'green');
      log('║                                                          ║', 'green');
      log('╚══════════════════════════════════════════════════════════╝', 'green');
      console.log();
    } else {
      console.log();
      log('⚠️  Some tests failed. Review the errors above.', 'yellow');
      console.log();
      log('Failed tests:', 'red');
      results.tests
        .filter((t) => !t.passed)
        .forEach((t) => {
          log(`  • ${t.name}: ${t.error}`, 'red');
        });
      console.log();
    }

    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    log('\n❌ Fatal error during test execution:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
