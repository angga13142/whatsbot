#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║     🔍 CRITICAL FIXES VERIFICATION                       ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

echo "Running verification tests..."
echo ""

# Test 1: node-cache
echo -n "1. Checking node-cache installation... "
if npm list node-cache &> /dev/null; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((passed++))
else
  echo -e "${RED}❌ FAIL${NC}"
  ((failed++))
fi

# Test 2: Database indexes
echo -n "2. Checking database indexes... "
result=$(node -e "const knex = require('./src/database/connection'); (async () => { const idx = await knex.raw(\"SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'\"); console.log(idx.length); process.exit(0); })()" 2>&1 | tail -1)
if [ "$result" -ge 20 ]; then
  echo -e "${GREEN}✅ PASS${NC} ($result indexes)"
  ((passed++))
else
  echo -e "${RED}❌ FAIL${NC} (only $result indexes)"
  ((failed++))
fi

# Test 3: Environment config
echo -n "3. Checking environment config... "
if [ -f .env ] && grep -q "SESSION_SECRET" .env && grep -q "ENCRYPTION_KEY" .env; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((passed++))
else
  echo -e "${YELLOW}⚠️  WARNING${NC} (.env missing or incomplete)"
  ((failed++))
fi

# Test 4: Rate limiter
echo -n "4. Testing rate limiter... "
result=$(node -e "const rl = require('./src/middleware/rateLimiter'); (async () => { const r = await rl.checkLimit(999, 'test'); console.log(r.allowed); process.exit(0); })()" 2>&1 | tail -1)
if [ "$result" = "true" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((passed++))
else
  echo -e "${RED}❌ FAIL${NC}"
  ((failed++))
fi

# Test 5: Cache utility
echo -n "5. Testing cache utility... "
result=$(node -e "const c = require('./src/utils/cache'); c.set('verify_test', 'ok'); console.log(c.get('verify_test')); c.del('verify_test'); process.exit(0);" 2>&1 | tail -1)
if [ "$result" = "ok" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((passed++))
else
  echo -e "${RED}❌ FAIL${NC}"
  ((failed++))
fi

# Test 6: Validators
echo -n "6. Testing input validators... "
result=$(node -e "const v = require('./src/utils/validators'); const r = v.validateTransaction({type:'paket',amount:5000,description:'Test'}); console.log(r.isValid); process.exit(0);" 2>&1 | tail -1)
if [ "$result" = "true" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((passed++))
else
  echo -e "${RED}❌ FAIL${NC}"
  ((failed++))
fi

# Test 7: Error handler
echo -n "7. Testing error handler... "
result=$(node -e "const eh = require('./src/middleware/errorHandler'); const err = eh.createError('ValidationError', 'Test'); const h = eh.handle(err); console.log(h.success === false); process.exit(0);" 2>&1 | tail -1)
if [ "$result" = "true" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((passed++))
else
  echo -e "${RED}❌ FAIL${NC}"
  ((failed++))
fi

# Test 8: Authorization middleware
echo -n "8. Testing authorization... "
result=$(node -e "const auth = require('./src/middleware/authorizationMiddleware'); const r = auth.hasPermission({role:'admin'}, 'user:create'); console.log(r); process.exit(0);" 2>&1 | tail -1)
if [ "$result" = "true" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((passed++))
else
  echo -e "${RED}❌ FAIL${NC}"
  ((failed++))
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "📊 VERIFICATION SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo -e "✅ Passed: ${GREEN}$passed${NC}/8"
echo -e "❌ Failed: ${RED}$failed${NC}/8"
echo "════════════════════════════════════════════════════════════"

if [ $failed -eq 0 ]; then
  echo -e "${GREEN}"
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║                                                          ║"
  echo "║     🎉 ALL VERIFICATIONS PASSED!                         ║"
  echo "║                                                          ║"
  echo "║     System is production ready! 🚀                       ║"
  echo "║                                                          ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  exit 0
else
  echo -e "${RED}"
  echo "⚠️  Some verifications failed. Please review above."
  echo -e "${NC}"
  exit 1
fi
