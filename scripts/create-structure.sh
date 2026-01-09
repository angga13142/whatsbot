#!/bin/bash

# ══════════════════════════════════════════════════════════
# Create Project Structure Script
#
# This script creates the complete folder structure
# for the WhatsApp Cashflow Tracker Bot.
#
# Usage: bash scripts/create-structure.sh
# ══════════════════════════════════════════════════════════

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     📁 Creating Project Structure                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Create directories
DIRECTORIES=(
    # Source code
    "src/bot"
    "src/bot/handlers"
    "src/bot/middleware"
    "src/commands/common"
    "src/commands/karyawan"
    "src/commands/bos"
    "src/commands/investor"
    "src/commands/superadmin"
    "src/services"
    "src/database/migrations"
    "src/database/seeds"
    "src/database/repositories"
    "src/utils"
    "src/templates/messages"
    "src/templates/exports"
    "src/schedulers"
    "src/config"

    # Tests
    "tests/unit"
    "tests/integration"
    "tests/e2e"

    # Storage
    "storage/auth"
    "storage/images"
    "storage/reports"
    "storage/backups"
    "storage/logs"

    # Scripts
    "scripts"

    # Documentation
    "docs"
)

echo -e "${CYAN}Creating directories...${NC}"
echo ""

for dir in "${DIRECTORIES[@]}"; do
    if [ !  -d "$dir" ]; then
        mkdir -p "$dir"
        touch "$dir/.gitkeep"
        echo -e "  ${GREEN}✅${NC} Created: $dir"
    else
        echo -e "  ${BLUE}ℹ️${NC}  Exists:   $dir"
    fi
done

echo ""
echo -e "${GREEN}✅ Project structure created successfully!${NC}"
echo ""

# Show tree structure (if tree command is available)
if command -v tree &> /dev/null; then
    echo -e "${CYAN}Project Structure:${NC}"
    echo ""
    tree -L 3 -I 'node_modules|.git|coverage|dist|build'
fi

echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "  1. Start implementing bot logic in src/"
echo "  2. Add tests in tests/"
echo "  3. Update documentation in docs/"
echo ""

exit 0
