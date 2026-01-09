# Contributing to WhatsApp Cashflow Bot

We love your input! We want to make contributing to this project as easy and transparent as possible.

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3. Increase the version numbers in any examples file and the README.md to the new version that this Pull Request would represent.
4. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

## Code Style

- We use **Prettier** for formatting and **ESLint** for linting.
- Run `npm run lint` and `npm run format:check` before committing.
- Follow **Conventional Commits** for commit messages:
  - `feat: add new transaction type`
  - `fix: resolve pdf generation error`
  - `docs: update readme`

## Testing

- We use **Jest** for testing.
- New features _must_ include unit tests.
- Run `npm test` to verify all tests pass.
