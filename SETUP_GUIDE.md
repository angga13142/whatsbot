# ✅ **NEXT STEPS SETELAH COPILOT GENERATE**

## 🔍 **1. VERIFY & INSTALL**

```bash
# Install semua dependencies yang Copilot suggest
npm install

# Install dev dependencies (biasanya Copilot kasih command)
npm install --save-dev eslint prettier husky lint-staged @commitlint/cli @commitlint/config-conventional

# Setup Husky
npx husky install
```

---

## 🧪 **2. TEST SETUP (Quick Check)**

```bash
# Test ESLint
npm run lint

# Test Prettier
npm run format:check

# Test Commit (will trigger hooks)
git add .
git commit -m "test: setup code quality tools"
# ↑ Seharusnya auto-format & lint

# Test all scripts
npm run test
```

---

## ✅ **3. VERIFICATION CHECKLIST**

```
☐ ESLint berjalan tanpa error
☐ Prettier auto-format saat save file di VS Code
☐ Git commit trigger pre-commit hook
☐ Commit message harus pakai format (feat: , fix:, etc)
☐ VS Code show recommended extensions popup
☐ npm test berjalan (meskipun belum ada test)
```

---

## 🚨 **4. COMMON ISSUES & FIXES**

**Issue: Husky hooks tidak jalan**

```bash
# Fix:
chmod +x .husky/*
npx husky install
```

**Issue: ESLint error di semua file**

```bash
# Fix:
npm run lint:fix
```

**Issue: Prettier conflict dengan ESLint**

```bash
# Fix:  Install config
npm install --save-dev eslint-config-prettier
```

---

## 🎯 **5. FINAL TEST**

Coba bikin file test:

```javascript
// test.js
const x = 'hello'; // intentional error (no semicolon)
console.log(x);

// Save file → Should auto-format
// Git add → Should auto-fix
// Git commit "wrong format" → Should be REJECTED
// Git commit "test:  sample" → Should be ACCEPTED
```
