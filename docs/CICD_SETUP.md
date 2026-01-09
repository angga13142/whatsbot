# 🚀 CI/CD Setup Guide

## Prerequisites

### Required GitHub Secrets

Add these secrets in: `Settings` → `Secrets and variables` → `Actions`

#### Staging Environment

```
STAGING_HOST          # staging.yourdomain.com
STAGING_USER          # deploy-user
STAGING_SSH_KEY       # Private SSH key for staging server
```

#### Production Environment

```
PROD_HOST            # yourdomain.com
PROD_USER            # deploy-user
PROD_SSH_KEY         # Private SSH key for production server
```

#### Optional

```
SNYK_TOKEN           # For security scanning
CODECOV_TOKEN        # For code coverage
NOTIFICATION_EMAIL   # For failure notifications
MAIL_SERVER          # SMTP server
MAIL_USERNAME        # SMTP username
MAIL_PASSWORD        # SMTP password
```

## Server Setup

### 1. Prepare Server

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/cashflow-bot
sudo chown $USER:$USER /var/www/cashflow-bot

# Create backup directory
sudo mkdir -p /var/backups
```

### 2. Setup SSH Access

On your local machine:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""

# Copy public key to server
ssh-copy-id -i ~/.ssh/deploy_key.pub user@your-server.com
```

Add private key to GitHub Secrets:

```bash
cat ~/.ssh/deploy_key
# Copy output to STAGING_SSH_KEY or PROD_SSH_KEY secret
```

### 3. Configure Server Environment

```bash
# On server
cd /var/www/cashflow-bot

# Create .env file
nano .env
# Add production environment variables
```

## Workflow Triggers

### Automatic Triggers

- **CI Pipeline**: Runs on every push to `main` or `develop`, and on all PRs
- **Deploy Staging**: Automatic on push to `main`
- **Deploy Production**: Automatic on version tags (`v*.*.*`)
- **Scheduled Jobs**:
  - Daily backup at 2 AM UTC
  - Weekly dependency check on Mondays at 9 AM UTC

### Manual Triggers

All workflows can be triggered manually from GitHub Actions tab.

## Creating a Release

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This will:

1. Trigger CI pipeline
2. Run all tests
3. Deploy to production
4. Create GitHub release

## Monitoring

### Check Workflow Status

1. Go to repository on GitHub
2. Click "Actions" tab
3. View running/completed workflows

### View Logs

Click on any workflow run to see detailed logs for each job.

### Health Checks

Add health check endpoint to your app:

```javascript
// src/app.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.APP_VERSION,
    uptime: process.uptime(),
  });
});
```

## Troubleshooting

### Deployment Fails

1. Check SSH connection:

```bash
ssh -i ~/.ssh/deploy_key user@server "echo Connected"
```

2. Check server logs:

```bash
ssh user@server "pm2 logs"
```

### Tests Fail

1. Run locally:

```bash
npm test
```

2. Check test logs in GitHub Actions

### Database Migration Fails

```bash
# Rollback migration
ssh user@server "cd /var/www/cashflow-bot && npm run migrate:rollback"
```

## Best Practices

1. **Always test locally first**
2. **Use feature branches**
3. **Write tests for new features**
4. **Update documentation**
5. **Review PR checks before merging**
6. **Monitor after deployment**

## Support

For issues with CI/CD setup, check:

- GitHub Actions documentation
- Server logs
- Application logs

---

**Setup Complete!** 🎉 Your CI/CD pipeline is ready!
