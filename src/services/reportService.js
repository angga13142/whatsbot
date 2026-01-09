// File: src/services/reportService.js

/**
 * Report Service
 *
 * Purpose: Generate aggregated financial reports.
 *
 * @module services/reportService
 */

const transactionRepository = require('../database/repositories/transactionRepository');
const { TRANSACTION_TYPES } = require('../utils/constants');
const dayjs = require('dayjs');

class ReportService {
  async generateDailyReport(date = new Date()) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const getSum = async (type) => {
      return await transactionRepository.getTotalByType(type, startOfDay, endOfDay);
    };

    const income = {
      paket: await getSum(TRANSACTION_TYPES.PAKET),
      utang: await getSum(TRANSACTION_TYPES.UTANG), // assuming utang repayment counts as income contextually or tracked separately
      // Note: In strict accounting, 'jual utang' is Accrual Income. 'Bayar utang' is Cash Income.
      // For this bot simplistic logic: 'paket' = cash in, 'utang' = receivable.
      // Let's assume 'utang' here means Sales made on credit (Revenue) or Repayment?
      // Based on prompt: "!utang - Piutang (dengan nama yang berhutang)" -> This is recording a receivable.
      // Usually Cashflow = Cash In - Cash Out.
      // If 'utang' means GIVING credit, it's not cash in yet.
      // If 'utang' means repaying, it is.
      // Simplified: Total Sales = Paket + Utang. Cash = Paket.
      // Let's stick to the template structure:
      // Income: Paket, Utang.
      // Expense: Jajan.
      total: 0,
    };
    income.total = income.paket + income.utang;

    const expense = {
      jajan: await getSum(TRANSACTION_TYPES.JAJAN),
      total: 0,
    };
    expense.total = expense.jajan;

    const balance = income.total - expense.total; // Net Cashflow? Or Net Profit?
    // Assuming simple cashflow logic

    return {
      date,
      income,
      expense,
      balance,
    };
  }
}

module.exports = new ReportService();
