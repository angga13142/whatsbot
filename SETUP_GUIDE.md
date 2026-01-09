# 🚀 WhatsApp Bot - Complete Setup Guide

Panduan lengkap untuk setup dan development WhatsApp Bot dengan code quality tools dan CI/CD.

## 📋 Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git** >= 2.x
- **VS Code** (recommended)

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/angga13142/whatsbot.git
cd whatsbot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
```

### 4. Verify Installation

```bash
npm test
npm run lint
```

## 🎯 Development Commands

```bash
# Start bot
npm start

# Development mode
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

## ✅ Code Quality Tools

### ESLint

- Checks code for issues
- Auto-fix with `npm run lint:fix`

### Prettier

- Formats code consistently
- Runs on save in VS Code

### Commitlint

- Validates commit messages
- Format: `type(scope?): subject`
- Types: feat, fix, docs, style, refactor, test, etc.

### Husky + Lint-staged

- Pre-commit: Runs linting & formatting
- Commit-msg: Validates commit message

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feat/your-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feat/your-feature
```

## 🧪 Testing

Write tests in `test/unit/`:

```javascript
describe('YourFeature', () => {
  test('should work', () => {
    expect(true).toBe(true);
  });
});
```

## 🚀 CI/CD

GitHub Actions runs on:

- Push to master
- Pull requests

Checks:

- ✅ Linting
- ✅ Tests
- ✅ Coverage

## 📝 Commit Message Format

```
type(scope?): subject

Examples:
feat: add message handler
fix: resolve connection issue
docs: update README
test: add unit tests
```

## 🆘 Troubleshooting

### Reinstall Husky

```bash
rm -rf .husky
npx husky init
echo "npx lint-staged" > .husky/pre-commit
echo "npx --no-install commitlint --edit \$1" > .husky/commit-msg
```

### Clear Jest Cache

```bash
npx jest --clearCache
```

### Reinstall Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

## 🔗 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)

---

**Happy Coding! 🚀**
