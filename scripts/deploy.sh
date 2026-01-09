#!/bin/bash

# Quick Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=$(date +%Y%m%d-%H%M%S)

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║     🚀 DEPLOYMENT SCRIPT                               ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
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
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo ""

# Confirm deployment
read -p "Continue with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo -e "${RED}Deployment cancelled${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Starting deployment...${NC}"
echo ""

# Step 1: Run tests
echo -e "${BLUE}[1/8]${NC} Running tests..."
npm test || {
  echo -e "${RED}❌ Tests failed! Deployment aborted.${NC}"
  exit 1
}
echo -e "${GREEN}✅ Tests passed${NC}"
echo ""

# Step 2: Build deployment package
echo -e "${BLUE}[2/8]${NC} Creating deployment package..."
tar -czf "deploy-${VERSION}.tar.gz" \
  --exclude='tests' \
  --exclude='coverage' \
  --exclude='.git' \
  --exclude='node_modules/.cache' \
  src/ \
  scripts/ \
  node_modules/ \
  package.json \
  ecosystem.config.js
echo -e "${GREEN}✅ Package created${NC}"
echo ""

# Step 3: Backup current version on server
echo -e "${BLUE}[3/8]${NC} Creating backup on server..."
SSH_OPTS=""
if [ -n "$SSH_KEY" ]; then
  SSH_OPTS="-i $SSH_KEY"
fi

ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
  cd /var/www/cashflow-bot 2>/dev/null || exit 0
  tar -czf "/var/backups/cashflow-bot/backup-$(date +%Y%m%d-%H%M%S).tar.gz" \
    --exclude='node_modules' \
    --exclude='storage/logs' \
    src/ package.json .env 2>/dev/null || true
  echo "✅ Backup created"
EOF
echo ""

# Step 4: Upload package
echo -e "${BLUE}[4/8]${NC} Uploading to server..."
scp $SSH_OPTS "deploy-${VERSION}.tar.gz" "${SERVER_USER}@${SERVER_HOST}:/tmp/"
echo -e "${GREEN}✅ Upload complete${NC}"
echo ""

# Step 5: Stop application
echo -e "${BLUE}[5/8]${NC} Stopping application..."
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
  cd /var/www/cashflow-bot 2>/dev/null || true
  pm2 stop ecosystem.config.js 2>/dev/null || true
  echo "✅ Application stopped"
EOF
echo ""

# Step 6: Extract and deploy
echo -e "${BLUE}[6/8]${NC} Deploying new version..."
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << EOF
  cd /var/www/cashflow-bot
  tar -xzf /tmp/deploy-${VERSION}.tar.gz
  rm /tmp/deploy-${VERSION}.tar.gz

  # Run migrations
  npm run migrate

  echo "✅ Deployment complete"
EOF
echo ""

# Step 7: Start application
echo -e "${BLUE}[7/8]${NC} Starting application..."
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
  cd /var/www/cashflow-bot
  pm2 start ecosystem.config.js
  pm2 save
  echo "✅ Application started"
EOF
echo ""

# Step 8: Health check
echo -e "${BLUE}[8/8]${NC} Running health check..."
sleep 10
ssh $SSH_OPTS "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
  pm2 list
  echo ""
  echo "Checking logs for errors..."
  pm2 logs --lines 20 --nostream
EOF

# Cleanup
rm "deploy-${VERSION}.tar.gz"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║     ✅ DEPLOYMENT SUCCESSFUL!                          ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo -e "${YELLOW}Server: ${SERVER_HOST}${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Monitor application for 30 minutes"
echo "2. Test critical functionalities"
echo "3. Check error logs"
echo "4. Notify team of successful deployment"
echo ""
