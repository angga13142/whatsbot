# WhatsApp Cashflow Bot

Real-time cashflow tracking bot with role-based access control, built for high availability and ease of use.

## 🚀 Features

- **Role-Based Access Control**: Superadmin, Admin (Bos), Karyawan, Investor
- **Transaction Tracking**: Sales, Debts, Expenses
- **Smart Validation**: Auto-approve thresholds, manual approvals
- **Reporting**: Daily summaries, Excel/PDF exports, extensive filtering
- **Security**: 2FA for sensitive actions, Immutable transactions history
- **Audit Logging**: Complete tracking of all actions

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL or SQLite
- WhatsApp Account (Multi-device beta supported)
- PM2 (for production)

## 🛠️ Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/whatsapp-cashflow-bot.git
   cd whatsapp-cashflow-bot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Initialize Database**

   ```bash
   npm run migrate
   npm run seed
   ```

5. **Start the Bot**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── bot/              # WhatsApp client logic
├── commands/         # Command handlers by role
├── config/           # Configuration files
├── database/         # Migrations and seeds
├── services/         # Business logic
├── utils/            # Helper functions
└── index.js          # Entry point
```

## 📚 Documentation

- [Contributing Guidelines](docs/CONTRIBUTING.md)
- [Code of Conduct](docs/CODE_OF_CONDUCT.md)

## 📄 License

This project is licensed under the MIT License.
