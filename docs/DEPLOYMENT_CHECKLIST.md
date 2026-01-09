# 🚀 Production Deployment Checklist

Comprehensive checklist untuk memastikan deployment yang aman dan sukses.

---

## 📋 TABLE OF CONTENTS

1. [Pre-Deployment Checklist](#-pre-deployment-checklist)
2. [Server Preparation](#️-server-preparation)
3. [Application Deployment](#-application-deployment)
4. [Post-Deployment Verification](#-post-deployment-verification)
5. [Rollback Procedures](#-rollback-procedures)
6. [Emergency Contacts](#-emergency-contacts)

---

## 🎯 PRE-DEPLOYMENT CHECKLIST

### Code Quality & Testing

- [ ] **All tests passing**

  ```bash
  npm test
  # Expected: 100% pass rate
  ```

- [ ] **Code coverage meets threshold**

  ```bash
  npm test -- --coverage
  # Expected: >80% coverage
  ```

- [ ] **Linting passes**

  ```bash
  npm run lint
  # Expected: 0 errors, 0 warnings
  ```

- [ ] **Formatting is correct**

  ```bash
  npm run format:check
  # Expected: All files formatted correctly
  ```

- [ ] **No security vulnerabilities**

  ```bash
  npm audit --audit-level=moderate
  # Expected: 0 vulnerabilities
  ```

- [ ] **Dependencies up to date**
  ```bash
  npm outdated
  # Review and update critical packages
  ```

### Documentation

- [ ] **README.md updated**
- [ ] **CHANGELOG.md updated**
- [ ] **API documentation current**
- [ ] **Environment variables documented**

### Configuration

- [ ] **Environment variables set**
- [ ] **Database migrations ready**
- [ ] **Backup strategy confirmed**
- [ ] **Monitoring configured**

### Version Control

- [ ] **All changes committed**

  ```bash
  git status
  # Expected: nothing to commit, working tree clean
  ```

- [ ] **Version tagged**

  ```bash
  git tag -a v1.0.0 -m "Production release v1.0.0"
  git push origin v1.0.0
  ```

- [ ] **Release notes prepared**

### Team Communication

- [ ] **Deployment window scheduled**
- [ ] **Deployment plan shared**
- [ ] **Downtime (if any) communicated**

---

## 🖥️ SERVER PREPARATION

### Server Requirements

- [ ] **Server specifications verified**
  - [ ] CPU: Minimum 2 cores
  - [ ] RAM: Minimum 2GB
  - [ ] Disk: Minimum 20GB free space
  - [ ] OS: Ubuntu 20.04 LTS or newer

- [ ] **Required software installed**
  ```bash
  node -v    # Expected: v18.0.0+
  npm -v     # Expected: 9.0.0+
  pm2 -v     # Expected: Latest version
  psql --version  # Expected: PostgreSQL 14+
  ```

### Server Setup

- [ ] **Create application user**

  ```bash
  sudo adduser --system --group --home /var/www cashflow-bot
  sudo usermod -aG www-data cashflow-bot
  ```

- [ ] **Create directory structure**

  ```bash
  sudo mkdir -p /var/www/cashflow-bot
  sudo mkdir -p /var/www/cashflow-bot/storage/{auth,images,reports,backups,logs}
  sudo mkdir -p /var/backups/cashflow-bot
  sudo chown -R cashflow-bot:cashflow-bot /var/www/cashflow-bot
  ```

- [ ] **Configure firewall**
  ```bash
  sudo ufw enable
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  ```

### Database Setup

- [ ] **Database server running**
- [ ] **Database created**
- [ ] **Database user configured**
- [ ] **Database backed up (if existing)**

### Security Hardening

- [ ] **SSH key authentication enabled**
- [ ] **Fail2ban installed and configured**
- [ ] **Automatic security updates enabled**
- [ ] **File permissions secured**

---

## 📦 APPLICATION DEPLOYMENT

### Pre-Deployment Backup

- [ ] **Current version backed up**
- [ ] **Database backed up**

### Stop Current Application

- [ ] **Application stopped gracefully**
  ```bash
  pm2 stop ecosystem.config.js
  ```

### Deploy New Version

- [ ] **Code uploaded to server**
- [ ] **Dependencies installed**
  ```bash
  npm ci --only=production
  ```
- [ ] **Environment file updated**
- [ ] **Database migrations run**
  ```bash
  npm run migrate
  ```
- [ ] **File permissions verified**

### Start Application

- [ ] **Application started**
  ```bash
  pm2 start ecosystem.config.js
  pm2 save
  ```
- [ ] **PM2 monitoring enabled**

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Application Health Checks

- [ ] **Application is running** (`pm2 list`)
- [ ] **Process not restarting** (restarts = 0)
- [ ] **No errors in logs**
- [ ] **Memory usage normal** (< 500MB)
- [ ] **CPU usage normal** (< 50%)

### Functional Testing

- [ ] **Bot authenticates with WhatsApp**
- [ ] **Database connection working**
- [ ] **Bot responds to /start command**
- [ ] **Transaction creation works**
- [ ] **Approval workflow works**
- [ ] **Reports generate correctly**

### Performance Testing

- [ ] **Response time acceptable**
- [ ] **Concurrent users handled**
- [ ] **Database queries optimized**

### Monitoring & Alerts

- [ ] **Error tracking configured**
- [ ] **Uptime monitoring active**
- [ ] **Log aggregation working**

### Security Verification

- [ ] **SSL/TLS working (if applicable)**
- [ ] **Unauthorized access blocked**
- [ ] **2FA working (if enabled)**
- [ ] **Audit logging working**

### Backup Verification

- [ ] **Scheduled backups configured**
- [ ] **Backup script tested**
- [ ] **Backup restoration tested**

---

## 🔄 ROLLBACK PROCEDURES

### When to Rollback

Immediate rollback required if:

- Critical functionality broken
- Data corruption detected
- Security vulnerability introduced
- Application crashes repeatedly
- Performance severely degraded

### Rollback Steps

1. **Stop current version**

   ```bash
   pm2 stop all
   ```

2. **Restore previous code**

   ```bash
   LATEST_BACKUP=$(ls -t /var/backups/cashflow-bot/backup-*.tar.gz | head -1)
   tar -xzf "$LATEST_BACKUP"
   ```

3. **Rollback database**

   ```bash
   LATEST_DB=$(ls -t /var/backups/cashflow-bot/db-*.sql.gz | head -1)
   gunzip < "$LATEST_DB" | psql cashflow_production
   ```

4. **Restart application**

   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

5. **Verify rollback**
6. **Notify team**

---

## 📞 EMERGENCY CONTACTS

### Team Contacts

| Role              | Name   | Phone  | Email  |
| ----------------- | ------ | ------ | ------ |
| Primary (On-Call) | **\_** | **\_** | **\_** |
| Secondary         | **\_** | **\_** | **\_** |
| Database Admin    | **\_** | **\_** | **\_** |
| DevOps Lead       | **\_** | **\_** | **\_** |

### Escalation Path

1. **Level 1**: On-call developer (Response: 15 min)
2. **Level 2**: Team lead (Response: 30 min)
3. **Level 3**: CTO/Manager (Response: 1 hour)

---

## 📊 DEPLOYMENT SIGN-OFF

### Pre-Deployment

- [ ] **Developer**: ********\_******** (Date: **\_**)
- [ ] **Tech Lead**: ********\_******** (Date: **\_**)
- [ ] **QA**: ********\_******** (Date: **\_**)

### Post-Deployment

- [ ] **Deployed By**: ********\_******** (Date: **\_**)
- [ ] **Verified By**: ********\_******** (Date: **\_**)
- [ ] **Approved By**: ********\_******** (Date: **\_**)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Maintained By:** DevOps Team
