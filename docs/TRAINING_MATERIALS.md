# WhatsApp Cashflow Bot - Training Materials

**Step-by-step training for new users**

---

## 📚 Training Overview

This training takes approximately 2 hours and includes:

- Part 1: Basic Operations (30 min)
- Part 2: Daily Workflows (30 min)
- Part 3: Reporting & Analytics (30 min)
- Part 4: Best Practices (30 min)

---

## PART 1: Basic Operations (30 minutes)

### Exercise 1.1: Starting the Bot (5 min)

**Objective:** Learn to start and navigate the bot

**Steps:**

1. Open WhatsApp
2. Find the cashflow bot in your contacts
3. Send: `/start`
4. Send: `/help`
5. Send: `/status`

**Expected Results:**

- Welcome message received
- Help menu displayed
- Status showing your role

**✅ Checkpoint:** Can you see your name and role?

---

### Exercise 1.2: Recording Income (10 min)

**Objective:** Learn to record sales/income

**Practice Transactions:**

1. `/paket 500000 Pengiriman ke Jakarta`
2. `/paket 750000 Penjualan produk A`
3. `/paket 1200000 Kontrak bulanan`

**What to observe:**

- Transaction confirmation
- Transaction ID format
- Auto-approval status
- Pending status (for amounts > 1M)

**✅ Checkpoint:** Did you receive 3 confirmation messages?

---

### Exercise 1.3: Recording Expenses (10 min)

**Objective:** Learn to track business expenses

**Practice Transactions:**

1. `/jajan 50000 Bensin motor`
2. `/jajan 150000 Makan tim`
3. `/jajan 200000 Supplies kantor`

**✅ Checkpoint:** Can you find these in `/history`?

---

### Exercise 1.4: Recording Debts (5 min)

**Objective:** Track customer debts

**Practice:**

1. `/utang 1000000 Toko ABC Pembelian barang`
2. `/utang 500000 Customer XYZ Pembayaran tertunda`

**✅ Checkpoint:** Check status - should be pending

---

## PART 2: Daily Workflows (30 minutes)

### Exercise 2.1: Morning Routine (10 min)

**Scenario:** You start your workday

**Tasks:**

1. Send `/status` - Check system
2. Send `/laporan` - Review yesterday (if Monday)
3. Send `/pending` - Check approvals needed
4. Record first transactions of the day

**✅ Checkpoint:** System status clear, ready to work

---

### Exercise 2.2: Throughout the Day (10 min)

**Scenario:** Record transactions as they happen

**Practice:** Record these in sequence:

1. 9:00 AM - `/paket 300000 Delivery pagi`
2. 10:30 AM - `/jajan 25000 Parkir`
3. 11:00 AM - `/paket 450000 Penjualan online`
4. 12:00 PM - `/jajan 40000 Makan siang`
5. 2:00 PM - `/paket 600000 COD customer`
6. 3:30 PM - `/jajan 75000 Bensin`
7. 4:00 PM - `/paket 800000 Transfer bank`

**✅ Checkpoint:** All 7 transactions recorded

---

### Exercise 2.3: End of Day (10 min)

**Scenario:** Closing daily operations

**Tasks:**

1. Send `/history` - Review all today's transactions
2. Send `/laporan` - Check daily summary
3. Check totals match your physical cash/receipts
4. Report any discrepancies to admin

**✅ Checkpoint:** Daily totals verified

---

## PART 3: Reporting & Analytics (30 minutes)

### Exercise 3.1: Basic Reports (10 min)

**Objective:** Generate and understand reports

**Practice:**

1. `/laporan` - Today
2. `/laporan 7` - Last week
3. `/laporan 30` - Last month
4. `/history 30` - Detailed transactions

**What to observe:**

- Income vs Expense
- Net cashflow
- Transaction count
- Top categories

**✅ Checkpoint:** Can you identify your highest expense day?

---

### Exercise 3.2: Visual Analytics (10 min)

**Objective:** Use charts and dashboard

**Practice:**

1. `/dashboard` - Overview
2. `/chart` - Monthly chart
3. Study the visual data

**What to observe:**

- Income/expense trends
- Category breakdown
- Growth indicators

**✅ Checkpoint:** Understand your cashflow trend

---

### Exercise 3.3: Forecasting (10 min)

**Objective:** Understand future predictions

**Practice:**

1. `/forecast 7` - Next week
2. `/forecast 30` - Next month
3. Compare with actual performance

**Questions to answer:**

- What's predicted income next week?
- What's predicted expense?
- Is trend going up or down?

**✅ Checkpoint:** Forecast numbers noted

---

## PART 4: Best Practices (30 minutes)

### Exercise 4.1: Description Best Practices (10 min)

**Objective:** Learn to write useful descriptions

**Poor vs Good Examples:**

❌ **Poor:** "fuel"  
✅ **Good:** "Fuel for delivery Jakarta route"

❌ **Poor:** "food"  
✅ **Good:** "Team lunch - Client meeting Resto ABC"

❌ **Poor:** "package"  
✅ **Good:** "COD package delivery - Customer John"

**Practice:** Rewrite these poor descriptions:

1. "stuff" →
2. "payment" →
3. "buy" →

**✅ Checkpoint:** Descriptions are clear and detailed

---

### Exercise 4.2: Error Prevention (10 min)

**Common Mistakes to Avoid:**

**Mistake 1:** Wrong amount

- ❌ `/paket 50000` (forgot zero)
- ✅ `/paket 500000`
- **Prevention:** Double-check before sending

**Mistake 2:** Wrong type

- ❌ `/paket 100000 Bensin` (should be expense)
- ✅ `/jajan 100000 Bensin`
- **Prevention:** Think: Did money come in or go out?

**Mistake 3:** Missing customer for debt

- ❌ `/utang 500000 Late payment`
- ✅ `/utang 500000 Toko ABC Late payment`
- **Prevention:** Always include customer name

**✅ Checkpoint:** Understand common mistakes

---

### Exercise 4.3: Real-World Scenario (10 min)

**Complete Scenario:** Busy day simulation

You have these transactions:

- 8:30 AM: Sold 3 packages, Rp 450,000 each
- 9:00 AM: Filled tank, Rp 75,000
- 10:00 AM: Customer ABC owes Rp 1,200,000
- 11:30 AM: Bought office supplies, Rp 150,000
- 1:00 PM: Lunch, Rp 35,000
- 2:00 PM: Sold package Rp 650,000
- 3:30 PM: Parking, Rp 5,000
- 4:00 PM: Customer DEF owes Rp 800,000

**Your Task:** Record all transactions correctly

**✅ Checkpoint:** All 8 transactions recorded with correct types and amounts

---

## 📝 Training Assessment

### Quiz Questions:

1. What command shows today's summary?
2. When are transactions auto-approved?
3. What information should debt transactions include?
4. How do you view last 30 days?
5. What does pending status mean?

### Practical Test:

**Record these 5 transactions:**

1. Income: Rp 750,000 - Package delivery Surabaya
2. Expense: Rp 100,000 - Vehicle maintenance
3. Debt: Rp 2,000,000 - Supplier payment pending
4. Income: Rp 450,000 - Online sale
5. Expense: Rp 60,000 - Communication credit

**Then:**

- Generate today's report
- Check your totals
- Export data

**✅ Passed if:** All transactions correct + report generated

---

## 🎓 Certification

**Congratulations!** You've completed basic training.

**Next Steps:**

1. Practice daily for 1 week
2. Read [USER_MANUAL.md](USER_MANUAL.md) fully
3. Try advanced features
4. Share tips with team

**For Admins:** Complete [ADMIN_GUIDE.md](ADMIN_GUIDE.md) training

---

**Document Version:** 1.0  
**Last Updated:** January 2026
