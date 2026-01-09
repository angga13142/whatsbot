#!/bin/bash

# ══════════════════════════════════════════════════════════
# Complete One-Command Setup
#
# This script runs all setup steps in one go.
#
# Usage: bash scripts/complete-setup.sh
# ══════════════════════════════════════════════════════════

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     🚀 Complete Setup - All in One                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Step 1: Foundation setup
echo -e "${CYAN}Running foundation setup...${NC}"
bash scripts/setup-foundation.sh

echo ""

# Step 2: Create structure
echo -e "${CYAN}Creating project structure...${NC}"
bash scripts/create-structure.sh

echo ""

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     ✅ COMPLETE SETUP FINISHED!                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo "🎉 Your project is ready for development!"
echo ""
echo "📝 Don't forget to:"
echo "  1. Edit .env file with your configuration"
echo "  2. Start coding in src/"
echo "  3. Run 'npm run dev' to start development"
echo ""

exit 0
