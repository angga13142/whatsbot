#!/bin/bash

# Quick Rollback Script
# Usage: ./scripts/rollback.sh [staging|production]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT=${1:-staging}

echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                                                        ║${NC}"
echo -e "${RED}║     ⚠️  ROLLBACK SCRIPT                                ║${NC}"
echo -e "${RED}║                                                        ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load configuration
if [ "$ENVIRONMENT" == "production" ]; then
  if [ -f .env.production ]; then
    source .env.production
  fi
  SERVER_HOST=${PROD_HOST:-""}
  SERVER_USER=${PROD_USER:-""}
  SSH_KEY=${PROD_SSH_KEY:-""}
else
  if [ -f .env.staging ]; then
    source .env.staging
  fi
  SERVER_HOST=${STAGING_HOST:-""}
  SERVER_USER=${STAGING_USER:-""}
  SSH_KEY=${STAGING_SSH_KEY:-""}
fi

# Validate configuration
if [ -z "$SERVER_HOST" ] || [ -z "$SERVER_USER" ]; then
  echo -e "${RED}❌ Missing server configuration!${NC}"
  echo "Please set STAGING_HOST/PROD_HOST and STAGING_USER/PROD_USER"
  exit 1
fi

echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Server: ${SERVER_HOST}${NC}"
echo ""

# Confirm rollback
echo -e "${RED}⚠️  WARNING: This will rollback to the previous version!${NC}"
read -p "Continue with rollback? Type 'ROLLBACK' to confirm: " CONFIRM
if [ "$CONFIRM" != "ROLLBACK" ]; then
  echo -e "${GREEN}Rollback cancelled${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}Starting rollback...${NC}"
echo ""

# SSH options
SSH_OPTS=""
if [ -n "$SSH_KEY" ]; then
  SSH_OPTS="-i $SSH_KEY"
fi

# Step 1: List available backups
echo -e "${BLUE}[1/5]${NC} Listing available backups..."
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
  echo "Available backups:"
  ls -lth /var/backups/cashflow-bot/backup-*.tar.gz 2>/dev/null | head -5 || echo "No backups found"
EOF
echo ""

read -p "Use latest backup? (yes/no): " USE_LATEST
echo ""

# Step 2: Stop application
echo -e "${BLUE}[2/5]${NC} Stopping application..."
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
  cd /var/www/cashflow-bot 2>/dev/null || true
  pm2 stop all 2>/dev/null || true
  pm2 delete all 2>/dev/null || true
EOF
echo -e "${GREEN}✅ Application stopped${NC}"
echo ""

# Step 3: Restore backup
echo -e "${BLUE}[3/5]${NC} Restoring backup..."
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
  cd /var/www/cashflow-bot

  # Get latest backup
  LATEST_BACKUP=$(ls -t /var/backups/cashflow-bot/backup-*.tar.gz 2>/dev/null | head -1)

  if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backup found!"
    exit 1
  fi

  echo "Restoring from: $LATEST_BACKUP"

  # Extract backup
  tar -xzf "$LATEST_BACKUP"

  echo "✅ Backup restored"
EOF
echo ""

# Step 4: Restore database (optional)
read -p "Restore database as well? (yes/no): " RESTORE_DB
if [ "$RESTORE_DB" == "yes" ]; then
  echo -e "${BLUE}[4/5]${NC} Restoring database..."
  ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
    LATEST_DB=$(ls -t /var/backups/cashflow-bot/db-*.sql.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_DB" ]; then
      echo "Restoring from: $LATEST_DB"
      gunzip < "$LATEST_DB" | psql cashflow_production
      echo "✅ Database restored"
    else
      echo "⚠️ No database backup found"
    fi
EOF
else
  echo -e "${YELLOW}Skipping database restore${NC}"
fi
echo ""

# Step 5: Restart application
echo -e "${BLUE}[5/5]${NC} Restarting application..."
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
  cd /var/www/cashflow-bot
  pm2 start ecosystem.config.js
  pm2 save

  # Wait and check status
  sleep 5
  pm2 list
EOF
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║     ✅ ROLLBACK COMPLETE!                              ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify application is working"
echo "2. Test critical functionalities"
echo "3. Investigate what went wrong"
echo "4. Fix issues before re-deploying"
echo "5. Notify team of rollback"
echo ""
