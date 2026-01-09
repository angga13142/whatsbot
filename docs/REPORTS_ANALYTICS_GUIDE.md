# WhatsApp Cashflow Bot - Reports & Analytics Guide

**Version:** 1.0  
**For:** Power Users & Analysts

---

## 📊 Reports & Analytics Overview

Master advanced reporting and analytics features to gain deep insights into your business cashflow.

---

## 📑 Table of Contents

1. [Quick Reports](#quick-reports)
2. [Custom Reports](#custom-reports)
3. [Data Export](#data-export)
4. [Charts & Visualizations](#charts-visualizations)
5. [Dashboard](#dashboard)
6. [Forecasting](#forecasting)
7. [Business Insights](#business-insights)
8. [Best Practices](#best-practices)

---

## 1. Quick Reports

### Overview

Quick reports provide instant insights for common time periods.

### Available Quick Reports

```
/report quick today          # Today's summary
/report quick yesterday      # Yesterday's summary
/report quick this_week      # Current week
/report quick last_week      # Previous week
/report quick this_month     # Current month
/report quick last_month     # Previous month
/report quick this_quarter   # Current quarter
/report quick last_quarter   # Previous quarter
/report quick this_year      # Current year
/report quick last_year      # Previous year
```

### Report Content

Each quick report includes:

- **Total Income:** Sum of all income
- **Total Expense:** Sum of all expenses
- **Net Cashflow:** Income - Expenses
- **Transaction Count:** Number of transactions
- **Top Categories:** Highest spending categories
- **Trend Indicator:** Up/down compared to previous period

### Example Output

```
📊 QUICK REPORT: THIS MONTH
══════════════════════════════════════════════════
Period: 01 Jan - 10 Jan 2026

💰 FINANCIAL SUMMARY
────────────────────────────────────────────────────
Income:        Rp 15.000.000
Expense:       Rp  8.500.000
────────────────────────────────────────────────────
Net Cashflow:  Rp  6.500.000 ✅

📈 TREND
▲ +12.5% vs last period

📊 TOP CATEGORIES
1. Sales (Paket)      Rp 15.000.000
2. Fuel (Jajan)       Rp  3.500.000
3. Food (Jajan)       Rp  2.000.000

📋 TRANSACTION COUNT
Total: 45 transactions
• Income: 25
• Expense: 18
• Debt: 2

💡 INSIGHTS
• Cash position: Strong
• Spending trend: Normal
• Revenue growth: Positive
```

---

## 2. Custom Reports

### Creating Custom Reports

Step-by-step process to create reusable custom reports.

#### Step 1: Initialize Report Creation

```
Command: /report create
```

#### Step 2: Configure Report

Bot will guide you through:

**1. Report Name:**

```
Name your report (e.g., "Weekly Sales Report")
```

**2. Date Range:**

- Last 7 days
- Last 30 days
- This month
- Custom date range

**3. Filters:**

- Transaction types (income/expense/debt)
- Specific categories
- Tags
- Amount range
- User (admin only)

**4. Grouping:**

- By date
- By category
- By user
- By tag

**5. Sorting:**

- Amount (high to low)
- Date (newest/oldest)
- Category

#### Step 3: Save & Execute

Report is saved and can be reused.

### Managing Custom Reports

**List all saved reports:**

```
/report list
```

**Execute saved report:**

```
/report execute [report-id]

Example:
/report execute 1
```

**Edit report:**

```
/report edit [report-id]
```

**Delete report:**

```
/report delete [report-id]
```

### Use Cases

**Weekly Sales Report:**

- Filter: Income transactions only
- Group by: Category
- Period: Last 7 days
- Schedule: Every Monday

**Monthly Expense Analysis:**

- Filter: Expense transactions
- Group by: Category
- Sort by: Amount (high to low)
- Schedule: First of month

**Customer Debt Report:**

- Filter: Debt transactions, status=unpaid
- Group by: Customer
- Sort by: Amount (high to low)
- Schedule: Weekly

---

## 3. Data Export

### Export Formats

#### Excel (.xlsx)

**Best for:**

- Financial analysis
- Pivot tables
- Charts in Excel
- Professional reports

**Command:**

```
/export excel
```

**Contains:**

- Summary sheet
- Transactions sheet
- Category breakdown
- Charts
- Formatted tables

**Example use:**

```
/export excel
> Processing...
> Excel file generated
> [Download: transactions_Jan2026.xlsx]
```

#### CSV (.csv)

**Best for:**

- Data import to other systems
- Large datasets
- Simple data manipulation
- Database imports

**Command:**

```
/export csv
```

**Contains:**

- Raw transaction data
- All fields
- No formatting
- Easy to parse

#### JSON (.json)

**Best for:**

- API integration
- Custom processing
- Developers
- Data interchange

**Command:**

```
/export json
```

**Structure:**

```json
{
  "summary": {
    "total_income": 15000000,
    "total_expense": 8500000,
    "net": 6500000
  },
  "transactions": [
    {
      "id": "TRX-001",
      "type": "income",
      "amount": 1000000,
      "description": "..."
    }
  ]
}
```

#### PDF (.pdf)

**Best for:**

- Printing
- Archiving
- Professional presentation
- Email distribution

**Command:**

```
/export pdf
```

**Contains:**

- Executive summary
- Detailed transactions
- Charts & graphs
- Professional formatting

### Export Options

**Date Range:**

```
/export excel this_month
/export excel last_quarter
/export excel custom
```

**Filters:**

```
/export excel category:fuel
/export excel amount:>1000000
/export excel user:john
```

**Scheduled Exports:**

Admin can schedule automatic exports:

- Daily (end of day)
- Weekly (Monday morning)
- Monthly (first of month)
- Custom schedule

---

## 4. Charts & Visualizations

### Chart Types

#### Bar Chart

**Purpose:** Compare income vs expense

**Command:**

```
/chart bar [period]

Examples:
/chart bar this_month
/chart bar this_quarter
```

**Shows:**

- Green bars: Income
- Red bars: Expenses
- Net cashflow line

#### Line Chart

**Purpose:** Show trends over time

**Command:**

```
/chart line [period]

Examples:
/chart line last_3_months
/chart line this_year
```

**Shows:**

- Income trend
- Expense trend
- Net cashflow trend

#### Pie Chart

**Purpose:** Category distribution

**Command:**

```
/chart pie [period] [group]

Examples:
/chart pie this_month category
/chart pie this_quarter user
```

**Shows:**

- Percentage by category
- Visual proportion
- Top categories highlighted

#### Donut Chart

**Purpose:** Similar to pie, modern style

**Command:**

```
/chart donut [period]

Example:
/chart donut this_month
```

### Chart Customization

**Colors:**

- Income: Green
- Expense: Red
- Neutral: Blue/Gray

**Labels:**

- Amounts in Rupiah
- Percentages shown
- Category names

**Legend:**

- Always included
- Sorted by amount
- Top items labeled

---

## 5. Dashboard

### Dashboard Overview

Comprehensive view of all key metrics.

**Command:**

```
/dashboard

Or with period:
/dashboard this_month
/dashboard this_quarter
```

### Dashboard Components

#### Financial Summary

```
💰 FINANCIAL OVERVIEW
────────────────────────────────────────────────────
Income:      Rp 15.000.000   ▲ +12.5%
Expense:     Rp  8.500.000   ▲  +8.3%
Net:         Rp  6.500.000   ▲ +20.1%
Margin:      43.3%           ▲  +2.8%
```

#### Key Performance Indicators (KPIs)

```
📊 KEY METRICS
────────────────────────────────────────────────────
Avg Daily Income:     Rp 1.500.000
Avg Daily Expense:    Rp   850.000
Burn Rate:            Rp   850.000/day
Runway:               45 days
ROI:                  76.5%
```

#### Category Breakdown

```
📋 TOP CATEGORIES
────────────────────────────────────────────────────
1. Sales           Rp 15.000.000  (100% of income)
2. Fuel            Rp  3.500.000  (41% of expense)
3. Food            Rp  2.000.000  (24% of expense)
4. Transport       Rp  1.500.000  (18% of expense)
5. Operations      Rp  1.500.000  (18% of expense)
```

#### Recent Transactions

```
📝 RECENT ACTIVITY
────────────────────────────────────────────────────
• [10:30] Delivery Jakarta     +Rp 1.500.000
• [09:15] Fuel                 -Rp   100.000
• [08:00] Customer Payment     +Rp 2.000.000
```

#### Trend Indicators

```
📈 TRENDS
────────────────────────────────────────────────────
Revenue:      ▲ Growing (+12.5%)
Expenses:     ▲ Rising (+8.3%)
Profitability: ▲ Improving (+2.8%)
Cash Position: ✅ Strong
```

### Dashboard Periods

```
/dashboard today
/dashboard this_week
/dashboard this_month
/dashboard this_quarter
/dashboard this_year
```

---

## 6. Forecasting

### Cashflow Forecast

Predict future cashflow based on historical patterns.

**Command:**

```
/forecast cashflow [days]

Examples:
/forecast cashflow 7     # Next 7 days
/forecast cashflow 30    # Next 30 days
/forecast cashflow 90    # Next 90 days
```

### Forecast Output

```
🔮 CASHFLOW FORECAST: NEXT 30 DAYS
══════════════════════════════════════════════════
Based on last 60 days of data
Confidence: 78%

📊 PREDICTED SUMMARY
────────────────────────────────────────────────────
Expected Income:    Rp 22.500.000
Expected Expense:   Rp 12.750.000
Predicted Net:      Rp  9.750.000

📈 DAILY BREAKDOWN
────────────────────────────────────────────────────
Week 1:  +Rp 2.450.000
Week 2:  +Rp 2.380.000
Week 3:  +Rp 2.520.000
Week 4:  +Rp 2.400.000

💡 INSIGHTS
────────────────────────────────────────────────────
• Trend: Positive and stable
• Peak expected: Week 3
• Lowest: Week 2
• Seasonality detected: Yes

⚠️ RECOMMENDATIONS
────────────────────────────────────────────────────
• Maintain current expense level
• Prepare for Week 3 peak
• Monitor Week 2 dip
• Cash reserve: Sufficient
```

### Revenue Forecast

**Command:**

```
/forecast revenue 30
```

Predicts only income/revenue.

### Expense Forecast

**Command:**

```
/forecast expense 30
```

Predicts only expenses.

### Forecast Accuracy

**Factors affecting accuracy:**

- Data history (more = better)
- Transaction regularity
- Seasonal patterns
- Business stability

**Typical accuracy:**

- 7-day forecast: 85-90%
- 30-day forecast: 70-80%
- 90-day forecast: 60-70%

---

## 7. Business Insights

### Quick Insights

**Command:**

```
/insights
```

AI-powered analysis of your financial data.

### Insight Categories

#### Spending Patterns

```
💡 SPENDING INSIGHTS
────────────────────────────────────────────────────
• Fuel costs increased 15% this month
• Weekend spending 30% higher than weekdays
• Lunch expenses trending up (+20%)
• Operations costs stable

🎯 RECOMMENDATIONS
• Consider fuel-efficient routes
• Review weekend operations
• Set lunch budget limit
```

#### Revenue Insights

```
💰 REVENUE INSIGHTS
────────────────────────────────────────────────────
• Peak sales days: Monday, Thursday
• Average deal size: Rp 1.2M
• Best customers: 5 accounts (60% of revenue)
• Growth rate: +12.5% month-over-month

🎯 OPPORTUNITIES
• Focus on top customers
• Replicate Monday/Thursday success
• Upsell to increase deal size
```

#### Cashflow Health

```
💚 CASHFLOW HEALTH: EXCELLENT
────────────────────────────────────────────────────
• Strong cash position
• Positive trend
• Adequate reserves
• Low burn rate

✅ STRENGTHS
• Revenue growing
• Expenses controlled
• Healthy margins
• No liquidity issues
```

### Deep Analysis

**Command:**

```
/insights deep
```

Comprehensive business analysis.

**Includes:**

- Profitability metrics
- Growth indicators
- Customer analytics
- Risk assessment
- Detailed recommendations
- Competitive benchmarks

### Anomaly Detection

**Command:**

```
/insights anomalies
```

Detects unusual patterns:

- Sudden expense spikes
- Revenue drops
- Unusual transaction amounts
- Frequency changes
- Pattern deviations

**Example:**

```
⚠️ ANOMALIES DETECTED
────────────────────────────────────────────────────
1. HIGH PRIORITY
   Fuel expense 3x normal on Jan 8
   Investigation recommended

2. MEDIUM PRIORITY
   No transactions on Jan 5 (unusual)
   Possible system issue or holiday

3. LOW PRIORITY
   Transaction #TRX-045 amount unusual
   Verify accuracy
```

---

## 8. Best Practices

### Report Generation

**✅ Do:**

- Generate reports regularly (weekly/monthly)
- Export for backup
- Review trends consistently
- Act on insights
- Share with stakeholders

**❌ Don't:**

- Wait for issues to check reports
- Ignore trend warnings
- Skip regular reviews
- Overlook small changes

### Data Analysis

**Weekly Review:**

```
☐ Run quick report for week
☐ Check dashboard
☐ Review anomalies
☐ Adjust budget if needed
☐ Export for records
```

**Monthly Review:**

```
☐ Generate monthly report
☐ Compare to forecast
☐ Analyze variances
☐ Update forecasts
☐ Present to management
☐ Archive data
```

### Forecasting Tips

**For Better Forecasts:**

- Record all transactions promptly
- Maintain data consistency
- Include all expense types
- Update regularly
- Review forecast vs actual
- Adjust assumptions

### Insight Action Plan

**When Insights Generated:**

1. Read all insights carefully
2. Prioritize by impact
3. Create action items
4. Assign responsibilities
5. Set deadlines
6. Track implementation
7. Measure results

---

## Quick Reference

### Report Commands Summary

```
# Quick Reports
/report quick [period]

# Custom Reports
/report create
/report list
/report execute [id]

# Export
/export excel
/export csv
/export json
/export pdf

# Charts
/chart bar [period]
/chart line [period]
/chart pie [period] [group]

# Dashboard
/dashboard [period]

# Forecasting
/forecast cashflow [days]
/forecast revenue [days]
/forecast expense [days]

# Insights
/insights
/insights deep
/insights anomalies
```

---

**Master these features to unlock full analytical power! 📊**

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**© 2026 Your Company Name. All rights reserved.**
