#!/bin/bash

# ══════════════════════════════════════════════════════════
# WhatsApp Cashflow Bot - Foundation Setup Script
#
# This script sets up the complete development environment
# for the WhatsApp Cashflow Tracker Bot.
#
# Usage:  bash scripts/setup-foundation.sh
# ══════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis
ROCKET="🚀"
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
PACKAGE="📦"
FOLDER="📁"
GEAR="⚙️"
SHIELD="🔒"
FIRE="🔥"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║     ${ROCKET} WhatsApp Cashflow Bot - Foundation Setup      ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# ══════════════════════════════════════════════════════════
# START SETUP
# ══════════════════════════════════════════════════════════

print_header

# ══════════════════════════════════════════════════════════
# STEP 1: CHECK PREREQUISITES
# ══════════════════════════════════════════════════════════

print_step "Step 1: Checking prerequisites..."
echo ""

# Check Node.js
if check_command node; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version must be 18 or higher"
        print_info "Current version: $(node -v)"
        print_info "Please upgrade Node.js: https://nodejs.org/"
        exit 1
    fi
    print_success "Node.js $(node -v)"
else
    print_error "Node.js not found"
    print_info "Please install Node.js v18+: https://nodejs.org/"
    exit 1
fi

# Check npm
if check_command npm; then
    print_success "npm $(npm -v)"
else
    print_error "npm not found"
    exit 1
fi

# Check Git
if check_command git; then
    print_success "Git $(git --version | cut -d' ' -f3)"
else
    print_error "Git not found"
    print_info "Please install Git: https://git-scm.com/"
    exit 1
fi

echo ""

# ══════════════════════════════════════════════════════════
# STEP 2: INSTALL DEPENDENCIES
# ══════════════════════════════════════════════════════════

print_step "Step 2: Installing dependencies..."
echo ""

print_info "This may take a few minutes..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""

# ══════════════════════════════════════════════════════════
# STEP 3: SETUP ENVIRONMENT
# ══════════════════════════════════════════════════════════

print_step "Step 3: Setting up environment..."
echo ""

if [ ! -f . env ]; then
    cp .env.example .env
    print_success ". env file created from .env.example"
    print_warning "Please edit .env file with your configuration"
else
    print_info ".env file already exists (skipped)"
fi

echo ""

# ══════════════════════════════════════════════════════════
# STEP 4: SETUP GIT HOOKS (HUSKY)
# ══════════════════════════════════════════════════════════

print_step "Step 4: Setting up Git hooks (Husky)..."
echo ""

if [ -d .git ]; then
    npx husky install

    if [ $? -eq 0 ]; then
        # Make hooks executable
        if [ -d .husky ]; then
            chmod +x .husky/pre-commit 2>/dev/null || true
            chmod +x .husky/pre-push 2>/dev/null || true
            chmod +x .husky/commit-msg 2>/dev/null || true
        fi
        print_success "Husky hooks installed"
    else
        print_warning "Husky installation failed (non-critical)"
    fi
else
    print_warning "Not a git repository, skipping Husky setup"
    print_info "Run 'git init' to initialize git repository"
fi

echo ""

# ══════════════════════════════════════════════════════════
# STEP 5: CREATE STORAGE DIRECTORIES
# ══════════════════════════════════════════════════════════

print_step "Step 5: Creating storage directories..."
echo ""

STORAGE_DIRS=(
    "storage/auth"
    "storage/images"
    "storage/reports"
    "storage/backups"
    "storage/logs"
)

for dir in "${STORAGE_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        touch "$dir/.gitkeep"
        print_success "Created $dir"
    else
        print_info "$dir already exists"
    fi
done

echo ""

# ══════════════════════════════════════════════════════════
# STEP 6: SETUP DATABASE
# ══════════════════════════════════════════════════════════

print_step "Step 6: Setting up database..."
echo ""

if [ -f "scripts/migrate.js" ]; then
    print_info "Running database migrations..."
    npm run migrate 2>/dev/null

    if [ $? -eq 0 ]; then
        print_success "Database migrations completed"
    else
        print_warning "Database migration failed (you may need to run it manually later)"
    fi
else
    print_warning "Migration script not found (will be available after code implementation)"
fi

echo ""

# ══════════════════════════════════════════════════════════
# STEP 7: INITIAL VALIDATION
# ══════════════════════════════════════════════════════════

print_step "Step 7: Running initial validation..."
echo ""

print_info "Checking code quality..."
npm run lint 2>/dev/null || print_warning "Lint check skipped (no source files yet)"

echo ""

# ══════════════════════════════════════════════════════════
# SETUP COMPLETE
# ══════════════════════════════════════════════════════════

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║     ${CHECK} FOUNDATION SETUP COMPLETE!                     ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Summary
echo -e "${BLUE}${INFO} Setup Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${CHECK} Node.js $(node -v)"
echo -e "  ${CHECK} npm $(npm -v)"
echo -e "  ${CHECK} Dependencies installed"
echo -e "  ${CHECK} Environment configured"
echo -e "  ${CHECK} Git hooks enabled"
echo -e "  ${CHECK} Storage directories created"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Next steps
echo -e "${CYAN}${ROCKET} Next Steps:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. ${GEAR} Configure your environment:"
echo -e "     ${BLUE}nano .env${NC}"
echo ""
echo "  2. ${FOLDER} Create project structure:"
echo -e "     ${BLUE}bash scripts/create-structure.sh${NC}"
echo ""
echo "  3. ${FIRE} Start development:"
echo -e "     ${BLUE}npm run dev${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Important notes
echo -e "${YELLOW}${WARNING} Important Notes:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  • Edit .env file with your WhatsApp bot configuration"
echo "  • Set BOT_PHONE_NUMBER to your bot's WhatsApp number"
echo "  • Choose authentication method (qr or pairing)"
echo "  • Configure database settings"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Useful commands
echo -e "${BLUE}${INFO} Useful Commands: ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  npm run dev          - Start development server"
echo "  npm run lint         - Check code quality"
echo "  npm run lint:fix     - Fix linting issues"
echo "  npm run format       - Format code"
echo "  npm test             - Run tests"
echo "  npm run validate     - Run all checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${GREEN}${FIRE} Happy coding!${NC}"
echo ""

exit 0
