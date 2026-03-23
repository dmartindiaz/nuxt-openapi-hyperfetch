# 📚 Documentation Index

Welcome to the Nuxt Generator documentation! Choose your path:

## 🚀 For New Developers & AI Assistants

Start here if you're new to the project:

- **[Quick Start Guide](./QUICK-START.md)** - Understand the project in 5 minutes
  - What is this project?
  - Core concepts (Two-stage generation, wrapper pattern, runtime vs build-time)
  - Key files to read first
  - Most common tasks
  - Quick commands reference

## 🏗️ Understanding the Codebase

Learn about architecture and design decisions:

- **[Architecture & Design](./ARCHITECTURE.md)** - Patterns and decisions
  - Architectural overview
  - Core patterns explained
  - Design decisions (ADRs)
  - Component dependency map
  - Global callbacks system deep dive
  - Extension points

## 📖 Technical Reference

Complete API documentation:

- **[API Reference](./API-REFERENCE.md)** - Complete technical reference
  - CLI commands
  - Configuration options
  - All interfaces & types
  - Parser API
  - Template API
  - Runtime APIs
  - Callback interfaces
  - Generated composables reference

## 🔧 Development & Contributing

Guide for contributors:

- **[Development Guide](./DEVELOPMENT.md)** - Extending and contributing
  - Getting started
  - Development workflow
  - Adding new features
  - Testing changes
  - Code style guide
  - Common tasks
  - Debugging tips

## 🐛 Problem Solving

When things go wrong:

- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues & solutions
  - Installation problems
  - Generation errors
  - Runtime errors
  - Type errors
  - Callback issues
  - Performance problems
  - OpenAPI spec issues
  - Getting help

## 📋 Other Resources

- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute code
- **[License](../LICENSE)** - Project license

## Quick Navigation by Task

### "I want to understand what this project does"

→ Start with [Quick Start](./QUICK-START.md#what-is-this)

### "I want to know WHY it's built this way"

→ Read [Architecture - Design Decisions](./ARCHITECTURE.md#design-decisions-adrs)

### "I need to add a new feature"

→ Follow [Development Guide - Adding Features](./DEVELOPMENT.md#adding-features)

### "I'm getting an error"

→ Check [Troubleshooting Guide](./TROUBLESHOOTING.md)

### "I want to see all available options"

→ Browse [API Reference](./API-REFERENCE.md)

### "I want to understand how callbacks work"

→ Read [Architecture - Global Callbacks](./ARCHITECTURE.md#global-callbacks-deep-dive)

### "I want to extend the parser"

→ Follow [Development - Add Parser Feature](./DEVELOPMENT.md#add-parser-feature)

### "I want to add a new generator type"

→ Follow [Development - Add New Generator](./DEVELOPMENT.md#add-a-new-generator-type)

## Document Structure

Each document is organized for different purposes:

| Document        | Audience       | Purpose                        |
| --------------- | -------------- | ------------------------------ |
| Quick Start     | Newcomers, AI  | Fast onboarding, 5-min context |
| Architecture    | Developers     | Understand design & patterns   |
| API Reference   | All developers | Look up interfaces & functions |
| Development     | Contributors   | Extend & contribute            |
| Troubleshooting | All users      | Solve problems                 |

## Glossary

Quick reference for common terms:

- **Two-Stage Generation**: OpenAPI → TypeScript Fetch → Nuxt Composables
- **Wrapper Pattern**: Generated composables call runtime wrappers (useApiRequest)
- **Runtime Files**: Code copied to user's project (not imported from npm)
- **Build-time Runtime**: CLI tool environment (Node.js, ts-morph)
- **User Runtime**: User's Nuxt project (Vue 3, Nuxt composables)
- **MethodInfo**: Interface containing all data about an API endpoint
- **Parser**: ts-morph-based code that extracts API info from TypeScript
- **Template**: Functions that generate composable code
- **Global Callbacks**: Callbacks defined once in plugin, apply to all requests
- **BFF**: Backend for Frontend - pattern separating routing from business logic
- **Raw Composables**: useAsyncData composables that return headers + status
- **ADR**: Architectural Decision Record - documents why choices were made

## Contributing to Docs

Found a mistake or unclear section? Please:

1. [Open an issue](https://github.com/dmartindiaz/nuxt-openapi-hyperfetch/issues) describing the problem
2. Or submit a PR with improvements
3. Follow the [Contributing Guide](../CONTRIBUTING.md)

**Documentation Standards:**

- Use clear, concise language
- Include code examples for complex concepts
- Link between documents for cross-references
- Update related docs when making changes
- Test all command examples before committing

---

**Ready to dive in?** Start with the [Quick Start Guide](./QUICK-START.md)!
