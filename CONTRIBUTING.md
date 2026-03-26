# Contributing to Nuxt Generator

Thank you for your interest in contributing to Nuxt Generator! This document provides guidelines and instructions for contributing to the project.

## 📋 Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**

## 📚 Before You Start - Read the Documentation

Before contributing, we highly recommend reading the technical documentation in the `docs/` directory:

### Essential Reading

1. **[Quick Start Guide](./docs/QUICK-START.md)** - Understand the project structure and core concepts
   - Project overview and architecture
   - Key files and their purposes
   - Most common tasks

2. **[Architecture Documentation](./docs/ARCHITECTURE.md)** - Understand design decisions
   - Why the codebase is structured this way
   - Core patterns (two-stage generation, wrapper pattern, shared code)
   - Design decisions (ADRs) with trade-offs explained

3. **[Development Guide](./docs/DEVELOPMENT.md)** - Practical development instructions
   - How to add features (new callbacks, generators, parser features)
   - Testing strategies
   - Code style guidelines
   - Debugging tips

4. **[API Reference](./docs/API-REFERENCE.md)** - Complete technical reference
   - All interfaces and types
   - Parser, template, and runtime APIs
   - Callback system documentation

### Quick Reference

- Adding a new callback type? → See [Development Guide - Add a New Callback](./docs/DEVELOPMENT.md#add-a-new-callback-type)
- Adding a new generator? → See [Development Guide - Add a New Generator](./docs/DEVELOPMENT.md#add-a-new-generator-type)
- Parser not working? → See [Troubleshooting Guide](./docs/TROUBLESHOOTING.md#parser-not-finding-methods)
- Understanding global callbacks? → See [Architecture - Global Callbacks](./docs/ARCHITECTURE.md#global-callbacks-deep-dive)

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/dmartindiaz/nuxt-openapi-hyperfetch.git
cd nuxt-openapi-hyperfetch
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

## 🛠️ Development Workflow

### Available Scripts

| Script                 | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `npm run build`        | Compile TypeScript to JavaScript                        |
| `npm run start`        | Build and run the CLI                                   |
| `npm run lint`         | Check code for linting errors                           |
| `npm run lint:fix`     | Automatically fix linting errors                        |
| `npm run format`       | Format all code with Prettier                           |
| `npm run format:check` | Check if code is formatted correctly                    |
| `npm run type-check`   | Run TypeScript type checking without building           |
| `npm run validate`     | Run type-check + lint + format-check (pre-commit check) |

### Before Committing

**Always run these commands before committing:**

```bash
# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Validate everything
npm run validate
```

### Code Style

We use **ESLint** and **Prettier** to maintain consistent code style across the project.

#### ESLint Rules

- **TypeScript strict mode** - All code must pass type checking
- **No unused variables** - Prefix with `_` if intentionally unused
- **Prefer const** - Use `const` over `let` when possible
- **No var** - Always use `const` or `let`
- **Explicit return types** - Recommended but not enforced

#### Prettier Configuration

- **Single quotes** - Use `'` instead of `"`
- **Semicolons** - Always use semicolons
- **Trailing commas** - ES5 style (objects, arrays)
- **Print width** - 100 characters
- **Tab width** - 2 spaces
- **Line endings** - LF (Unix style)

### EditorConfig

The project includes an `.editorconfig` file. Make sure your editor supports EditorConfig:

- **VS Code**: Install "EditorConfig for VS Code" extension
- **WebStorm/IntelliJ**: Built-in support
- **Sublime**: Install "EditorConfig" package
- **Vim**: Install "editorconfig-vim" plugin

## 📝 Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bugfix-name
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code patterns
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Build the project
npm run build

# Test generation with example
npm run generator

# Or test with specific swagger file
node dist/index.js generate -i swagger.yaml -o ./test-output
```

### 4. Validate Your Code

```bash
# Run all checks
npm run validate

# This runs:
# - TypeScript type checking
# - ESLint
# - Prettier format check
```

### 5. Commit Your Changes

Use clear, descriptive commit messages:

```bash
# Good commit messages
git commit -m "feat: add support for x generator"
git commit -m "fix: resolve path issues on Windows"
git commit -m "docs: update README with global callbacks examples"
git commit -m "refactor: extract common parser logic to shared module"

# Follow conventional commits format
# <type>: <description>
# Types: feat, fix, docs, style, refactor, test, chore
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:

- **Clear title** - What does this PR do?
- **Description** - Why is this change needed?
- **Testing** - How did you test it?
- **Screenshots** - If applicable

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description** - Clear description of the bug
2. **Steps to reproduce** - Minimal steps to reproduce the issue
3. **Expected behavior** - What you expected to happen
4. **Actual behavior** - What actually happened
5. **Environment**:
   - Node.js version: `node --version`
   - npm version: `npm --version`
   - OS: Windows/Mac/Linux
6. **Swagger file** - If possible, provide the OpenAPI/Swagger file that causes the issue

## 💡 Suggesting Features

Feature requests are welcome! Please include:

1. **Use case** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Alternatives** - Have you considered other approaches?
4. **Examples** - Code examples if applicable

## 📂 Project Structure

```
nuxt-generator/
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── generate.ts                 # OpenAPI generator wrapper
│   ├── cli/                        # CLI utilities (prompts, logger, logo)
│   └── generators/
│       ├── shared/                 # Shared types and runtime helpers
│       ├── use-fetch/              # useFetch generator
│       ├── use-async-data/         # useAsyncData generator
│       ├── nuxt-server/            # Nuxt Server Routes generator
├── dist/                           # Compiled output
├── eslint.config.js                # ESLint configuration
├── .prettierrc.json                # Prettier configuration
├── .editorconfig                   # Editor configuration
├── tsconfig.json                   # TypeScript configuration
├── INSTRUCTIONS.md                 # Detailed technical documentation
└── README.md                       # User documentation
```

## 🧪 Testing

### Manual Testing

1. Generate composables from example swagger.yaml:

```bash
npm run generator
```

2. Test different generators:

```bash
# useFetch
echo useFetch | npm run generator

# useAsyncData
echo useAsyncData | npm run generator

# Nuxt Server Routes
echo nuxtServer | npm run generator
```

3. Verify generated code compiles in a Nuxt project

### Future: Automated Tests

We plan to add automated tests in the future. Contributions welcome!

## ❓ Questions?

- **Documentation**: Read the comprehensive docs in the `docs/` directory:
  - [Quick Start](./docs/QUICK-START.md) - Project overview and core concepts
  - [Architecture](./docs/ARCHITECTURE.md) - Design patterns and decisions
  - [Development Guide](./docs/DEVELOPMENT.md) - How to extend and contribute
  - [API Reference](./docs/API-REFERENCE.md) - Complete technical reference
  - [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- **Issues**: Search [existing issues](https://github.com/dmartindiaz/nuxt-openapi-hyperfetch/issues)
- **Discussions**: Start a [discussion](https://github.com/dmartindiaz/nuxt-openapi-hyperfetch/discussions)

## 📄 License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.

---

**Happy coding! 🚀**
