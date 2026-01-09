# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- **Start (Dev)**: `npm run dev` (uses nodemon, ignores storage/auth)
- **Start (Prod)**: `npm start`
- **Setup**: `npm run setup` (runs foundation setup)
- **Create Structure**: `npm run structure`

### Testing

- **Run All Tests**: `npm test`
- **Watch Mode**: `npm run test:watch`
- **Unit Tests**: `npm run test:unit`
- **Integration Tests**: `npm run test:integration`
- **CI Mode**: `npm run test:ci`
- **Specific File**: `npm test -- <path/to/file>`

### Database

- **Migrate**: `npm run migrate`
- **Rollback**: `npm run migrate:rollback`
- **Seed**: `npm run seed`
- **Backup**: `npm run backup`
- **Restore**: `npm run backup:restore`

### Quality & Maintenance

- **Lint**: `npm run lint`
- **Lint Fix**: `npm run lint:fix`
- **Format Check**: `npm run format:check`
- **Format Write**: `npm run format`
- **Validate**: `npm run validate` (lint + format + test)
- **Security Audit**: `npm run security:audit`

## Architecture

### Structure

- **src/bot/**: Core bot logic. `client.js` initializes the WhatsApp client.
  - **handlers/**: Message and event handlers.
  - **middleware/**: Auth, logging, rate limiting.
- **src/commands/**: Command definitions organized by user role.
  - `common/`, `karyawan/`, `bos/` (Admin), `investor/`, `superadmin/`.
- **src/services/**: Business logic layer.
  - `transactionService.js`, `userService.js`, `reportService.js`, `notificationService.js`.
- **src/database/**: Database access layer using Knex.js.
  - `repositories/`: Data access patterns.
  - `migrations/` & `seeds/`: Schema and initial data.
- **src/utils/**: Shared utilities (formatter, validator, NLP parser).
- **src/schedulers/**: Cron jobs (daily reports, backups).
- **storage/**: Persistent data (SQLite DB, auth sessions, images, logs).

### Key Concepts

- **Role-Based Access Control (RBAC)**: 4 levels - Superadmin (Dev), Admin (Owner), Karyawan (Employee), Investor.
- **Transaction Types**: Paket (Sales), Utang (Receivables), Jajan (Expenses).
- **State Management**: Uses state to handle multi-step interactions (e.g., inputting transaction details).
- **Database**: Supports both SQLite (dev) and PostgreSQL (prod) via Knex.js.
- **WhatsApp Client**: Uses `whatsapp-web.js` with Puppeteer. Handles authentication via QR or pairing code.

### Development Guidelines

- **Commits**: Follow Conventional Commits (`feat`, `fix`, `docs`, etc.). Verified by commitlint.
- **Testing**: Jest is used. Maintain high coverage (aim for >70-80%).
- **Linting**: ESLint + Prettier. Run `npm run lint:fix` before committing.
