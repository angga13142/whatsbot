# 🤖 WhatsApp Bot

[![CI](https://github.com/angga13142/whatsbot/actions/workflows/ci.yml/badge.svg)](https://github.com/angga13142/whatsbot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Professional WhatsApp bot built with Node.js, featuring comprehensive code quality tools and CI/CD pipeline.

## ✨ Features

- 🔧 Modern Node.js architecture
- ✅ Comprehensive test coverage with Jest
- 🎨 Code quality enforcement (ESLint + Prettier)
- 📝 Conventional commits with Commitlint
- 🔄 Automated CI/CD with GitHub Actions
- 🪝 Pre-commit hooks with Husky and lint-staged
- 📦 Ready for production deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/angga13142/whatsbot.git
cd whatsbot
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Run the bot:

```bash
npm start
```

## 📋 Available Scripts

```bash
# Start the bot
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Validate commit message
npm run commitlint
```

## 🏗️ Project Structure

```
whatsbot/
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
├── .husky/                 # Git hooks
│   ├── commit-msg         # Commit message validation
│   └── pre-commit         # Pre-commit checks
├── src/
│   └── index.js           # Main bot implementation
├── test/
│   └── unit/
│       └── bot.test.js    # Unit tests
├── .eslintrc.js           # ESLint configuration
├── .prettierrc.js         # Prettier configuration
├── .lintstagedrc.js       # Lint-staged configuration
├── commitlint.config.js   # Commitlint configuration
├── jest.config.js         # Jest configuration
├── app.js                 # Application entry point
└── package.json
```

## 🧪 Testing

### Run all tests

```bash
npm test
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Run tests in watch mode

```bash
npm run test:watch
```

Coverage reports are generated in the `coverage/` directory.

## 🎨 Code Quality

This project uses multiple tools to ensure code quality:

### ESLint

Configured with recommended rules and Jest plugin. Run:

```bash
npm run lint
```

### Prettier

Automatic code formatting. Run:

```bash
npm run format
```

### Commitlint

Enforces conventional commit messages. Format:

```
type(scope?): subject

Examples:
feat: add new message handler
fix: resolve connection issue
docs: update README
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

## 🔄 CI/CD

The project uses GitHub Actions for continuous integration:

- ✅ Runs on every push and pull request
- 🧪 Tests on Node.js 18.x and 20.x
- 📊 Generates test coverage reports
- ✨ Validates code quality (linting + formatting)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Commit Message Guidelines

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that don't affect code meaning
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `build:` Changes to build system or dependencies
- `ci:` Changes to CI configuration files
- `chore:` Other changes that don't modify src or test files

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Angga**

- GitHub: [@angga13142](https://github.com/angga13142)

## 🙏 Acknowledgments

- Built with [Node.js](https://nodejs.org/)
- Tested with [Jest](https://jestjs.io/)
- Linted with [ESLint](https://eslint.org/)
- Formatted with [Prettier](https://prettier.io/)
- CI/CD with [GitHub Actions](https://github.com/features/actions)

---

⭐ Star this repository if you find it helpful!
