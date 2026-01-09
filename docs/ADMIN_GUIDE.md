# WhatsApp Cashflow Bot - Admin Guide

**Version:** 1.0  
**For:** Administrators & SuperAdmins

---

## 📑 Table of Contents

1. [Admin Overview](#admin-overview)
2. [User Management](#user-management)
3. [Transaction Approval](#transaction-approval)
4. [System Monitoring](#system-monitoring)
5. [Reports & Analytics](#reports-analytics)

---

## 1. Admin Overview

### Admin Roles

| Role           | Permissions                                       |
| -------------- | ------------------------------------------------- |
| **Karyawan**   | Create transactions, view own data                |
| **Admin**      | Approve transactions, view all data, manage users |
| **SuperAdmin** | Full system access, system settings               |

### Admin Commands

```
/addkaryawan     # Add new staff
/addinvestor     # Add new investor
/suspend         # Suspend user
/pending         # View pending approvals
/approve         # Approve transaction
/reject          # Reject transaction
```

---

## 2. User Management

### Add New Staff

```
/addkaryawan [phone] [name]

Example:
/addkaryawan 628123456789 John Doe
```

### Add New Investor

```
/addinvestor [phone] [name]

Example:
/addinvestor 628987654321 Jane Smith
```

### Suspend User

```
/suspend [phone]

Example:
/suspend 628123456789
```

---

## 3. Transaction Approval

### View Pending Transactions

```
/pending
```

Shows all transactions awaiting approval (amounts > Rp 1,000,000).

### Approve Transaction

```
/approve [transaction-id]

Example:
/approve TRX-20260110-A1B2C3D4
```

### Reject Transaction

```
/reject [transaction-id] [reason]

Example:
/reject TRX-20260110-A1B2C3D4 Missing receipt
```

**Best Practices:**

- ✅ Review transaction details before approving
- ✅ Check amount accuracy
- ✅ Verify description clarity
- ✅ Approve within 24 hours
- ✅ Provide clear rejection reasons

---

## 4. System Monitoring

### Check System Status

```
/status
```

Shows:

- System uptime
- Database status
- Active users
- Recent activities

### View Logs

```
/logs
```

SuperAdmin only - view system logs and audit trail.

---

## 5. Reports & Analytics

### Admin Reports

```
/laporan [period]

Examples:
/laporan harian    # Daily report
/laporan bulanan   # Monthly report
```

### Export Options

All reports can be exported to Excel format.

---

## Maintenance Tasks

### Daily

- ☐ Check pending approvals
- ☐ Review suspicious transactions
- ☐ Monitor system status

### Weekly

- ☐ Review user activity
- ☐ Generate weekly report
- ☐ Backup database

### Monthly

- ☐ User access review
- ☐ System audit
- ☐ Performance optimization

---

**Document Version:** 1.0  
**Last Updated:** January 2026
