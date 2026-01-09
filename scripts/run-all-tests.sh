#!/bin/bash

# Complete Test Suite Runner

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║     🧪 RUNNING COMPLETE TEST SUITE                    ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_PASSED=0
TOTAL_FAILED=0

# Function to run test and track results
run_test_suite() {
  local name=$1
  local command=$2

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}📦 Running:  ${name}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  $command
  local result=$?

  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✅ ${name}:  PASSED${NC}"
    TOTAL_PASSED=$((TOTAL_PASSED + 1))
  else
    echo -e "${RED}❌ ${name}:  FAILED${NC}"
    TOTAL_FAILED=$((TOTAL_FAILED + 1))
  fi

  echo ""
}

# Unit Tests
run_test_suite "Unit Tests - Utilities" "npx jest tests/unit/utils --silent"

run_test_suite "Unit Tests - Services" "npx jest tests/unit/services --silent"

# Integration Tests
run_test_suite "Integration Tests - Database" "npx jest tests/integration/database.test.js --silent"
run_test_suite "Integration Tests - User Flow" "npx jest tests/integration/userFlow.test.js --silent"
run_test_suite "Integration Tests - Transaction Flow" "npx jest tests/integration/transactionFlow.test.js --silent"

# E2E Tests
run_test_suite "E2E Tests - Complete Workflow" "npx jest tests/e2e/completeWorkflow.test.js --silent"

# Summary
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║     📊 TEST SUMMARY                                    ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

TOTAL=$((TOTAL_PASSED + TOTAL_FAILED))

if [ $TOTAL_PASSED -gt 0 ]; then
  echo -e "   ${GREEN}✅ Passed: $TOTAL_PASSED/$TOTAL${NC}"
fi

if [ $TOTAL_FAILED -gt 0 ]; then
  echo -e "   ${RED}❌ Failed:  $TOTAL_FAILED/$TOTAL${NC}"
fi

echo ""

# Coverage Report
echo -e "${YELLOW}📈 Generating coverage report...${NC}"
npm test -- --coverage --silent

# Final result
echo ""
if [ $TOTAL_FAILED -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                                        ║${NC}"
  echo -e "${GREEN}║     ✅ ALL TESTS PASSED! 🎉                            ║${NC}"
  echo -e "${GREEN}║                                                        ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                                                        ║${NC}"
  echo -e "${RED}║     ❌ SOME TESTS FAILED                               ║${NC}"
  echo -e "${RED}║                                                        ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
