# WhatsApp Cashflow Bot - Command Reference

**Complete list of all commands**

---

## 📋 Common Commands (All Users)

| Command   | Description                 | Usage     |
| --------- | --------------------------- | --------- |
| `/start`  | Start bot & welcome message | `/start`  |
| `/help`   | Show help menu              | `/help`   |
| `/status` | Check system status         | `/status` |

---

## 💰 Transaction Commands

| Command    | Description              | Usage                                |
| ---------- | ------------------------ | ------------------------------------ |
| `/paket`   | Record income/sale       | `/paket 1000000 Description`         |
| `/jajan`   | Record expense           | `/jajan 50000 Description`           |
| `/utang`   | Record debt              | `/utang 500000 Customer Description` |
| `/catat`   | General transaction      | `/catat [type] [amount] [desc]`      |
| `/history` | View transaction history | `/history` or `/history 30`          |

---

## 📊 Reporting Commands

| Command      | Description       | Usage                      |
| ------------ | ----------------- | -------------------------- |
| `/laporan`   | Daily report      | `/laporan` or `/laporan 7` |
| `/dashboard` | Visual dashboard  | `/dashboard`               |
| `/chart`     | Generate charts   | `/chart`                   |
| `/export`    | Export to Excel   | `/export`                  |
| `/forecast`  | Cashflow forecast | `/forecast 30`             |

---

## 👨‍💼 Admin Commands

| Command        | Description            | Usage                         |
| -------------- | ---------------------- | ----------------------------- |
| `/addkaryawan` | Add staff              | `/addkaryawan [phone] [name]` |
| `/addinvestor` | Add investor           | `/addinvestor [phone] [name]` |
| `/suspend`     | Suspend user           | `/suspend [phone]`            |
| `/pending`     | View pending approvals | `/pending`                    |
| `/approve`     | Approve transaction    | `/approve [txn-id]`           |
| `/reject`      | Reject transaction     | `/reject [txn-id] [reason]`   |

---

## 👤 Customer Commands

| Command    | Description          | Usage                   |
| ---------- | -------------------- | ----------------------- |
| `/balance` | Check balance        | `/balance`              |
| `/invoice` | View invoices        | `/invoice [number]`     |
| `/pay`     | Payment instructions | `/pay [invoice-number]` |

---

## 🔧 SuperAdmin Commands

| Command  | Description       | Usage          |
| -------- | ----------------- | -------------- |
| `/sql`   | Execute SQL query | `/sql [query]` |
| `/logs`  | View system logs  | `/logs`        |
| `/users` | List all users    | `/users`       |

---

## Quick Tips

**Amount Format:**

- Use numbers only: `1000000` (1 million)
- No commas or dots
- Minimum: Rp 100

**Description Tips:**

- Be specific: ❌ "Fuel" ✅ "Fuel for delivery to Jakarta"
- Include details: ❌ "Food" ✅ "Team lunch at Resto ABC"
- Add references: "Invoice #123" or "PO-456"

**Auto-Approval:**

- Amounts ≤ Rp 1,000,000: Auto-approved
- Amounts > Rp 1,000,000: Requires admin approval

---

**Document Version:** 1.0  
**Last Updated:** January 2026
