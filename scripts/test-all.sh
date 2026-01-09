#!/bin/bash

echo "🧪 Running Complete Test Suite"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Run unit tests
echo -e "${YELLOW}📦 Running Unit Tests...${NC}"
npm run test:unit
UNIT_RESULT=$?

echo ""

echo "=============================="
echo "📊 Test Summary"
echo "=============================="

if [ $UNIT_RESULT -eq 0 ]; then
  echo -e "Unit Tests: ${GREEN}✅ PASS${NC}"
else
  echo -e "Unit Tests: ${RED}❌ FAIL${NC}"
fi

echo ""

# Overall result
if [ $UNIT_RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  exit 1
fi
