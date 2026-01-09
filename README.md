<div align="center">

# 💰 WhatsApp Cashflow Tracker Bot

<img src="https://img.shields.io/badge/Node.js-18+-green. svg" alt="Node.js" />
<img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
<img src="https://img.shields.io/badge/Maintained-Yes-success.svg" alt="Maintained" />

**Bot WhatsApp profesional untuk tracking cashflow real-time dengan role-based access control**

[Features](#-features) • [Installation](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Demo](#-demo)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

WhatsApp Cashflow Tracker Bot adalah solusi otomasi untuk tracking cashflow bisnis secara real-time melalui WhatsApp. Bot ini dirancang khusus untuk UKM/UMKM yang membutuhkan sistem pencatatan keuangan yang simple, cepat, dan mudah digunakan.

### Why This Bot?

- ✅ **No App Installation** - Menggunakan WhatsApp yang sudah familiar
- ✅ **Real-time Tracking** - Catat transaksi kapan saja, dimana saja
- ✅ **Role-based Access** - 4 level user dengan permission berbeda
- ✅ **Automated Reports** - Laporan harian otomatis
- ✅ **User-Friendly** - Interface dengan emoji dan rich text
- ✅ **Audit Trail** - Semua aktivitas tercatat
- ✅ **Secure** - 2FA untuk aksi sensitif

---

## ✨ Features

### 🎭 Role-Based Access Control

```
👑 Superadmin (Dev)
├─ Full system access
├─ Database management
├─ User management (all roles)
├─ System configuration
└─ Critical operations

👔 Admin (Bos)
├─ User management (Karyawan, Investor)
├─ Transaction approval
├─ Full reports access
├─ Business operations
└─ Cannot manage Superadmin/Admin

💼 Karyawan
├─ Input transactions
├─ View own reports
├─ Upload transaction images
└─ Basic operations

👀 Investor
├─ View censored reports (weekly/monthly)
├─ Limited analytics
└─ Read-only access
```

### 💰 Transaction Management

- **3 Transaction Types:**
  - 📦 **Paket** (Penjualan) - Sales transactions
  - 💳 **Utang** (Piutang) - Receivables with customer name
  - 🍔 **Jajan** (Pengeluaran) - Operational expenses

- **Smart Input:**
  - 📝 Interactive form (step-by-step)
  - 🧠 NLP parsing (natural language: "jual 5 paket @50rb")
  - 📸 Optional image upload
  - ✅ Auto-approval below threshold
  - 🔍 Manual approval above threshold

### 📊 Reporting System

- **Automated Daily Reports** (scheduled at 18:00)
- **On-Demand Reports:**
  - Daily summary
  - Per-karyawan breakdown
  - Custom date range
  - Excel/PDF export

- **Rich Text UI:**

  ```
  ╔═══════════════════════════════════════╗
  ║   📊 𝗟𝗔𝗣𝗢𝗥𝗔𝗡 𝗛𝗔𝗥𝗜𝗔𝗡              ║
  ╚═══════════════════════════════════════╝

  💵 Pemasukan     : Rp 4.000.000
  💸 Pengeluaran   : Rp 1.950.000
  💰 Saldo Bersih  : Rp 2.050.000
  ```

### 🔒 Security Features

- 🔐 **2FA Authentication** - PIN for sensitive operations
- 🎣 **Git Hooks** - Pre-commit validation
- 🔍 **Audit Logging** - Complete activity tracking
- 🛡️ **Input Validation** - Prevent SQL injection & XSS
- 🚨 **Rate Limiting** - Prevent abuse

### 🤖 Automation

- ⏰ Daily report scheduler
- 📦 Automatic database backup
- 🔔 Reminder notifications
- ⚠️ Anomaly alerts
- 📈 Archive old data (>1 year)

---

## 🎬 Demo

### Transaction Input Flow

```
User: catat transaksi

Bot: ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
     ┃   📝 𝗖𝗔𝗧𝗔𝗧 𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗕𝗔𝗥𝗨     ┃
     ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

     Pilih jenis transaksi:
     1️⃣  📦 PAKET (Penjualan)
     2️⃣  💳 UTANG
     3️⃣  🍔 JAJAN (Pengeluaran)

User: 1

Bot: 💰 Berapa nominalnya?

     💡 Cara input:
     • 250000
     • 250rb
     • "jual 5 paket @50rb"

User: jual 5 paket @50rb

Bot: ✅ 𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟 𝗗𝗜𝗖𝗔𝗧𝗔𝗧!

     🆔 ID:  #TRX-20260109-001
     💰 Nominal:  Rp 250.000
     📝 Keterangan: Jual 5 paket @50k
     ✅ Status: Approved
```

### Daily Report Example

```
📊 𝗟𝗔𝗣𝗢𝗥𝗔𝗡 𝗛𝗔𝗥𝗜𝗔𝗡
Kamis, 9 Januari 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 RINGKASAN CASHFLOW

💵 Pemasukan
   📦 Paket         : Rp 3.500.000
   💳 Utang Dibayar : Rp 500.000
   ─────────────────────────────
   TOTAL           : Rp 4.000.000

💸 Pengeluaran
   🍔 Operasional   : Rp 750.000
   📦 Stok          : Rp 1.200.000
   ─────────────────────────────
   TOTAL           : Rp 1.950.000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 SALDO BERSIH   : Rp 2.050.000
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                 WhatsApp Users                   │
│  (Superadmin, Admin, Karyawan, Investor)        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│           WhatsApp-Web. js Client                │
│        (Puppeteer + LocalAuth/RemoteAuth)       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              Bot Core Engine                     │
│  ┌──────────────────────────────────────────┐  │
│  │ • Message Handler                         │  │
│  │ • Command Router                          │  │
│  │ • Role-Based Access Control               │  │
│  │ • State Management                        │  │
│  │ • NLP Parser                              │  │
│  └──────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              Service Layer                       │
│  ┌────────────┬──────────────┬──────────────┐  │
│  │Transaction │ User         │ Report       │  │
│  │Service     │ Management   │ Generator    │  │
│  └────────────┴──────────────┴──────────────┘  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│           Database & Storage Layer              │
│  ┌──────────────────────────────────────────┐  │
│  │ PostgreSQL / SQLite                       │  │
│  │ • Users                                   │  │
│  │ • Transactions                            │  │
│  │ • Audit Logs                              │  │
│  │ • Reports Cache                           │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ File Storage                              │  │
│  │ • Transaction Images                      │  │
│  │ • Generated Reports                       │  │
│  │ • Backups                                 │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Core Technologies

- **Runtime:** Node.js 18+ (LTS)
- **WhatsApp Client:** whatsapp-web.js v1.23+
- **Browser Automation:** Puppeteer (bundled)
- **Database:** PostgreSQL 14+ (production) / SQLite 3 (development)
- **Query Builder:** Knex.js

### Key Libraries

| Purpose      | Library           | Version  |
| ------------ | ----------------- | -------- |
| WhatsApp API | whatsapp-web.js   | ^1.23.0  |
| Logging      | winston           | ^3.11.0  |
| Date/Time    | dayjs             | ^1.11.10 |
| Validation   | joi               | ^17.11.0 |
| NLP          | compromise        | ^14.10.0 |
| Scheduler    | node-cron         | ^3.0.3   |
| Excel Export | exceljs           | ^4.4.0   |
| PDF Export   | pdfkit            | ^0.14.0  |
| Encryption   | bcrypt            | ^5.1.1   |
| UI/Terminal  | chalk, boxen, ora | latest   |

### Development Tools

- **Code Quality:** ESLint, Prettier, EditorConfig
- **Git Hooks:** Husky, lint-staged, commitlint
- **Testing:** Jest, Supertest
- **CI/CD:** GitHub Actions
- **Process Manager:** PM2 (production)
- **Containerization:** Docker (optional)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** v9.0.0 or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **WhatsApp Account** (for bot authentication)

### Optional

- **PostgreSQL** v14+ (for production) - ([Download](https://www.postgresql.org/download/))
- **Docker** (for containerized deployment) - ([Download](https://www.docker.com/))
- **PM2** (for production process management) - `npm install -g pm2`

### System Requirements

- **OS:** Linux (Ubuntu 20.04+), macOS 11+, or Windows 10/11
- **RAM:** Minimum 1GB (2GB+ recommended)
- **Disk Space:** 500MB+ free space
- **Network:** Stable internet connection

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/whatsapp-cashflow-bot.git
cd whatsapp-cashflow-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit . env with your configuration
nano .env
```

**Required configurations:**

```bash
BOT_PHONE_NUMBER=628123456789    # Your bot's WhatsApp number
AUTH_METHOD=pairing               # "qr" or "pairing"
DB_TYPE=sqlite                    # "sqlite" or "postgresql"
SUPERADMIN_PHONE=628123456789     # Your admin phone number
```

### 4. Setup Database

```bash
# Run migrations
npm run migrate

# Seed initial data (creates default superadmin)
npm run seed
```

### 5. Start Bot

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 6. Authenticate WhatsApp

#### Option A: Pairing Code (Recommended for VPS)

```bash
# Bot will display pairing code
🔐 Pairing Code: KPL8-JY73

# On your phone:
# WhatsApp → Settings → Linked Devices
# → Link a Device → Link with phone number
# → Enter code: KPL8-JY73
```

#### Option B: QR Code (Recommended for Development)

```bash
# Set AUTH_METHOD=qr in .env
# Scan QR code displayed in terminal with WhatsApp
```

### 7. Verify Bot is Ready

```
✅ 𝗕𝗢𝗧 𝗦𝗜𝗔𝗣 𝗗𝗜𝗚𝗨𝗡𝗔𝗞𝗔𝗡!

📱 Bot Number: 628123456789
👤 Bot Name:  Cashflow Bot
🔋 Battery:  95%
📶 Connected: chrome
```

### 8. Test Bot

Send a WhatsApp message to your bot:

```
/start
```

You should receive a welcome message! 🎉

---

## ⚙️ Configuration

### Environment Variables

See [.env.example](.env.example) for all available options.

#### Essential Settings

```bash
# Application
NODE_ENV=development          # "development" or "production"
APP_NAME="Cashflow Bot"

# WhatsApp
BOT_PHONE_NUMBER=628123456789  # Format: country_code + number (no +, -, spaces)
AUTH_METHOD=pairing            # "qr" or "pairing"

# Database
DB_TYPE=sqlite                 # "sqlite" or "postgresql"
DB_PATH=./storage/database.sqlite

# Security
TWO_FA_ENABLED=true
AUTO_APPROVAL_THRESHOLD=1000000  # Auto-approve transactions below Rp 1 juta

# Reports
DAILY_REPORT_TIME=18:00        # 24-hour format
TIMEZONE=Asia/Jakarta
```

#### Database Configuration (PostgreSQL)

For production, use PostgreSQL:

```bash
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cashflow_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false
```

---

## 📖 Usage

### Common Commands

#### For All Users

```bash
/start          # Start bot and show welcome message
/help           # Show help and available commands
/status         # Check your account status
```

#### For Karyawan

```bash
/catat          # Start transaction input (interactive form)
/laporan        # View your daily report
/history        # View your transaction history

# Quick input (natural language)
catat transaksi
laporan saya
```

#### For Admin (Bos)

```bash
# User Management
/addkaryawan [phone] [name]    # Add new karyawan
/suspend [phone]                # Suspend user temporarily
/listuser                       # List all users

# Transaction Management
/approve [TRX-ID]               # Approve pending transaction
/reject [TRX-ID] [reason]       # Reject transaction
/pending                        # View pending transactions

# Reports
/laporan                        # Today's report
/karyawan [name]                # Report per karyawan
/minggu                         # Weekly report
/bulan                          # Monthly report
```

#### For Superadmin (Dev)

```bash
# All Admin commands +

# System Management
/sql [query]                    # Execute SQL query
/backup                         # Manual backup
/logs [filter]                  # View audit logs
/config [key] [value]           # Update system config

# User Management (Full)
/createadmin [phone] [name]     # Create new admin
/createdev [phone] [name]       # Create new superadmin
/promoteadmin [phone]           # Promote admin to superadmin
```

### Example Workflows

#### Workflow 1: Karyawan Input Transaction

```
1.  Karyawan: "catat transaksi"
2. Bot: "Pilih jenis:  1️⃣ Paket, 2️⃣ Utang, 3️⃣ Jajan"
3.  Karyawan: "1"
4. Bot: "Berapa nominal?"
5. Karyawan: "jual 5 item @50rb"
6. Bot: "✅ Transaksi berhasil!  Total: Rp 250.000"
7. Bot: (Auto-approved karena < threshold)
8. Bot: (Notifikasi ke admin - optional)
```

#### Workflow 2: Admin Approve Transaction

```
1. Karyawan input transaksi Rp 2.000.000 (> threshold)
2. Bot: "⏳ Transaksi menunggu approval #TRX-20260109-001"
3. Admin: "/pending"
4. Bot: (Shows pending transactions)
5. Admin: "/approve TRX-20260109-001"
6. Bot: "✅ Transaksi approved!"
7.  Karyawan: (Receives notification)
```

#### Workflow 3: Daily Report

```
# Automatic at 18:00 daily
Bot → Admin: (Sends comprehensive daily report)
- Total pemasukan/pengeluaran
- Breakdown per karyawan
- Breakdown per kategori
- Excel file attachment
```

---

## 📁 Project Structure

```
whatsapp-cashflow-bot/
│
├── 📁 src/                      # Source code
│   ├── 📁 bot/                  # WhatsApp bot core
│   │   ├── client.js            # WhatsApp client setup
│   │   ├── 📁 handlers/         # Message & event handlers
│   │   └── 📁 middleware/       # Auth, logging, rate limit
│   │
│   ├── 📁 commands/             # Bot commands by role
│   │   ├── 📁 common/           # Commands for all users
│   │   ├── 📁 karyawan/         # Karyawan-specific
│   │   ├── 📁 bos/              # Admin-specific
│   │   ├── 📁 investor/         # Investor-specific
│   │   └── 📁 superadmin/       # Superadmin-specific
│   │
│   ├── 📁 services/             # Business logic
│   │   ├── transactionService.js
│   │   ├── userService.js
│   │   ├── reportService.js
│   │   └── notificationService.js
│   │
│   ├── 📁 database/             # Database layer
│   │   ├── connection.js
│   │   ├── 📁 migrations/       # DB migrations
│   │   ├── 📁 seeds/            # Initial data
│   │   └── 📁 repositories/     # Data access
│   │
│   ├── 📁 utils/                # Utilities
│   │   ├── formatter.js         # Format currency, date, etc
│   │   ├── validator.js         # Input validation
│   │   ├── parser.js            # NLP parsing
│   │   └── richText.js          # Rich text generator
│   │
│   ├── 📁 templates/            # Message templates
│   │   ├── 📁 messages/         # Bot message templates
│   │   └── 📁 exports/          # Export templates
│   │
│   ├── 📁 schedulers/           # Cron jobs
│   │   ├── dailyReport.js
│   │   ├── backup.js
│   │   └── reminders.js
│   │
│   ├── 📁 config/               # Configuration
│   │   ├── database.js
│   │   └── whatsapp.js
│   │
│   └── app.js                   # Main entry point
│
├── 📁 tests/                    # Tests
│   ├── 📁 unit/                 # Unit tests
│   ├── 📁 integration/          # Integration tests
│   └── setup.js                 # Test setup
│
├── 📁 storage/                  # Storage
│   ├── 📁 auth/                 # WhatsApp auth files
│   ├── 📁 images/               # Transaction images
│   ├── 📁 reports/              # Generated reports
│   ├── 📁 backups/              # DB backups
│   └── 📁 logs/                 # Application logs
│
├── 📁 scripts/                  # Utility scripts
│   ├── migrate.js
│   ├── seed.js
│   └── backup.js
│
├── 📁 docs/                     # Documentation
│   ├── INSTALLATION.md
│   ├── CONFIGURATION.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── 📁 . github/                  # GitHub configs
│   ├── 📁 workflows/            # CI/CD workflows
│   └── 📁 ISSUE_TEMPLATE/       # Issue templates
│
├── 📄 package.json              # Dependencies
├── 📄 . env.example              # Environment template
├── 📄 . eslintrc.js              # ESLint config
├── 📄 .prettierrc.json          # Prettier config
├── 📄 jest.config.js            # Jest config
├── 📄 ecosystem.config.js       # PM2 config
└── 📄 README.md                 # This file
```

---

## 💻 Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Setup git hooks
npm run prepare

# Create project structure
npm run structure

# Start development server (with auto-reload)
npm run dev
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Run all validations
npm run validate
```

### Git Workflow

This project uses **Conventional Commits** with **Husky Git Hooks**.

#### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```bash
git commit -m "feat(transaction): add image upload support"
git commit -m "fix(auth): resolve pairing code timeout"
git commit -m "docs(readme): update installation steps"
```

#### Git Hooks

```bash
# Pre-commit (automatic)
# - Runs ESLint
# - Runs Prettier
# - Only on staged files

# Pre-push (automatic)
# - Runs all tests
# - Must pass before push

# Commit-msg (automatic)
# - Validates commit message format
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci

# Run specific test file
npm test -- tests/unit/userService.test.js
```

### Test Structure

```javascript
// Example test
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = createMockUser('karyawan');
      const result = await userService.createUser(userData);

      expect(result).toBeDefined();
      expect(result.role).toBe('karyawan');
    });
  });
});
```

### Coverage Requirements

- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 80%
- **Statements:** 80%

---

## 🚢 Deployment

### Deploy to VPS (Recommended)

#### 1. Prepare VPS

```bash
# SSH to VPS
ssh user@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL (optional)
sudo apt-get install postgresql postgresql-contrib
```

#### 2. Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/whatsapp-cashflow-bot.git
cd whatsapp-cashflow-bot

# Install dependencies
npm ci --production

# Setup environment
cp .env.example . env
nano .env  # Edit configuration

# Run migrations
npm run migrate

# Seed initial data
npm run seed

# Start with PM2
pm2 start ecosystem. config.js --env production
pm2 save
pm2 startup
```

#### 3. Setup Auto-deployment (GitHub Actions)

Add secrets to GitHub repository:

- `VPS_HOST`: Your VPS IP
- `VPS_USERNAME`: SSH username
- `VPS_SSH_KEY`: SSH private key
- `VPS_PROJECT_PATH`: Path to project on VPS

Push to `main` branch will automatically deploy! 🚀

### Deploy with Docker

```bash
# Build image
docker build -t whatsapp-cashflow-bot .

# Run container
docker run -d \
  --name cashflow-bot \
  -v $(pwd)/storage:/app/storage \
  -v $(pwd)/.env:/app/.env \
  --restart unless-stopped \
  whatsapp-cashflow-bot

# View logs
docker logs -f cashflow-bot
```

### Deploy with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📚 Documentation

- **[Installation Guide](docs/INSTALLATION.md)** - Detailed installation steps
- **[Configuration Guide](docs/CONFIGURATION.md)** - All configuration options
- **[API Reference](docs/API.md)** - Internal API documentation
- **[User Guide](docs/USER_GUIDE.md)** - End-user documentation
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment
- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute
- **[Changelog](CHANGELOG.md)** - Version history

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: Bot won't start

```bash
# Check Node.js version
node --version  # Should be v18+

# Check logs
npm run dev

# Clear cache
rm -rf node_modules
npm install
```

#### Issue: Pairing code expired

```bash
# Pairing codes expire after 60 seconds
# Restart bot to get new code
pm2 restart cashflow-bot
```

#### Issue: Database connection error

```bash
# Check database is running
# For PostgreSQL:
sudo systemctl status postgresql

# For SQLite, check file permissions:
ls -la storage/database. sqlite
```

#### Issue: WhatsApp disconnected

```bash
# Clear WhatsApp auth
rm -rf . wwebjs_auth/

# Restart and re-authenticate
npm start
```

### Debug Mode

```bash
# Enable debug mode
DEBUG=true npm run dev

# View detailed logs
tail -f storage/logs/combined.log
```

### Get Help

- 📖 Check [Documentation](docs/)
- 🐛 Open an [Issue](https://github.com/yourusername/whatsapp-cashflow-bot/issues)
- 💬 Join [Discussions](https://github.com/yourusername/whatsapp-cashflow-bot/discussions)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

### Quick Contribution Guide

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contributors

<a href="https://github.com/yourusername/whatsapp-cashflow-bot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=yourusername/whatsapp-cashflow-bot" />
</a>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 💖 Support

If this project helps you, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 📖 Improving documentation
- 🤝 Contributing code

---

## 🙏 Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp client library
- [Context7](https://context7.com) - Research and benchmarking
- All contributors who helped build this project

---

## 📞 Contact

**Your Name** - [@yourhandle](https://github.com/yourhandle)

**Project Link:** [https://github.com/yourusername/whatsapp-cashflow-bot](https://github.com/yourusername/whatsapp-cashflow-bot)

---

<div align="center">

**Made with ❤️ for Indonesian UKM/UMKM**

[⬆ Back to Top](#-whatsapp-cashflow-tracker-bot)

</div>
