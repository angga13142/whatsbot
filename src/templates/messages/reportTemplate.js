// File: src/templates/messages/reportTemplate.js

const { createBox, bold, createDivider } = require('../../utils/richText');
const { formatCurrency, formatDate } = require('../../utils/formatter');

module.exports = {
  dailyReportSummary(data, date = new Date()) {
    const header = createBox('📊 LAPORAN HARIAN');
    const dateStr = formatDate(date, 'dddd, DD MMMM YYYY');

    return `
${header}
📅 ${dateStr}

${createDivider()}

📈 ${bold('RINGKASAN CASHFLOW')}

💵 Pemasukan
   📦 Paket : ${formatCurrency(data.income.paket)}
   💳 Utang : ${formatCurrency(data.income.utang)}
   ──────────────
   TOTAL    : ${bold(formatCurrency(data.income.total))}

💸 Pengeluaran
   🍔 Jajan : ${formatCurrency(data.expense.jajan)}
   ──────────────
   TOTAL    : ${bold(formatCurrency(data.expense.total))}

${createDivider()}
💰 ${bold('SALDO BERSIH')} : ${bold(formatCurrency(data.balance))}
    `.trim();
  },
};
