# Nuxt Generator - Documentation Index

> **Note**: This project's documentation has been reorganized for better accessibility. All detailed technical documentation is now in the `docs/` directory.

---

## 📚 Documentation Structure

The documentation is organized to help different audiences find what they need quickly:

### 🚀 For New Developers & AI Assistants

**Start here if you're new to the project:**

👉 **[Quick Start Guide](./docs/QUICK-START.md)** - Understand the project in 5 minutes

- What is this project and how does it work?
- Core concepts you need to know (two-stage generation, wrapper pattern, runtime architecture)
- Key files to read first
- Most common development tasks
- Quick commands reference

### 🏗️ For Understanding Architecture

**Learn about design patterns and decisions:**

👉 **[Architecture & Design Documentation](./docs/ARCHITECTURE.md)** - Deep dive into patterns

- Architectural overview with diagrams
- Core patterns explained (two-stage generation, wrapper pattern, shared code, BFF)
- Design decisions (ADRs) with rationale and trade-offs
- Component dependency map
- Global callbacks system architecture
- Extension points for customization

### 📖 For Technical Reference

**Look up interfaces, functions, and APIs:**

👉 **[Complete API Reference](./docs/API-REFERENCE.md)** - Technical documentation

- CLI commands and options
- Configuration reference
- All TypeScript interfaces and types (MethodInfo, ApiRequestOptions, etc.)
- Parser API (extractMethodInfo, parseApiFile, scanApiFiles)
- Template API (generateComposableFile, generateFunctionBody)
- Runtime APIs (useApiRequest, useApiAsyncData, useApiAsyncDataRaw)
- Callback interfaces (RequestContext, SuccessContext, ErrorContext, FinishContext)
- Generated composables reference

### 🔧 For Development & Contributing

**Extend the generator or contribute code:**

👉 **[Development Guide](./docs/DEVELOPMENT.md)** - Practical development instructions

- Getting started with development
- Development workflow and best practices
- How to add new features:
  - Adding a new callback type
  - Adding a new generator
  - Adding parser features
- Testing strategies
- Code style guidelines
- Common development tasks
- Debugging tips and tools

### 🐛 For Problem Solving

**When things go wrong:**

👉 **[Troubleshooting Guide](./docs/TROUBLESHOOTING.md)** - Solutions to common issues

- Installation problems
- Generation errors (APIs directory not found, found 0 methods, etc.)
- Runtime errors (module not found, useFetch not defined, etc.)
- Type errors
- Callback troubleshooting (callbacks not firing, global callbacks not working)
- Performance optimization
- OpenAPI spec issues

---

## Quick Navigation

### By Role

| I am a...                     | Start here...                                        |
| ----------------------------- | ---------------------------------------------------- |
| New developer or AI assistant | [Quick Start Guide](./docs/QUICK-START.md)           |
| Contributor adding features   | [Development Guide](./docs/DEVELOPMENT.md)           |
| Architect reviewing design    | [Architecture Documentation](./docs/ARCHITECTURE.md) |
| Developer with an error       | [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)   |
| Looking up an interface/type  | [API Reference](./docs/API-REFERENCE.md)             |

### By Task

| I want to...                     | See...                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| Understand the project quickly   | [Quick Start - What is this?](./docs/QUICK-START.md#what-is-this)                       |
| Know why it's built this way     | [Architecture - Design Decisions](./docs/ARCHITECTURE.md#design-decisions-adrs)         |
| Add a new callback type          | [Development - Add Callback](./docs/DEVELOPMENT.md#add-a-new-callback-type)             |
| Add a new generator              | [Development - Add Generator](./docs/DEVELOPMENT.md#add-a-new-generator-type)           |
| Understand global callbacks      | [Architecture - Global Callbacks](./docs/ARCHITECTURE.md#global-callbacks-deep-dive)    |
| Debug parser not finding methods | [Troubleshooting - Parser Issues](./docs/TROUBLESHOOTING.md#parser-not-finding-methods) |
| Look up MethodInfo interface     | [API Reference - Interfaces](./docs/API-REFERENCE.md#methodinfo)                        |
| Understand execution order       | [API Reference - Callback Interfaces](./docs/API-REFERENCE.md#callback-interfaces)      |
| See all available CLI commands   | [API Reference - CLI Commands](./docs/API-REFERENCE.md#cli-commands)                    |

---

## Key Concepts (Quick Reference)

### Generator Backends

The CLI supports two backends for Stage 1 (OpenAPI → TypeScript Client):

| Backend | Flag | Requires | Notes |
|---|---|---|---|
| `official` | `--backend official` | Java 11+ | Uses `@openapitools/openapi-generator-cli` |
| `heyapi` | `--backend heyapi` | Node.js only | Uses `@hey-api/openapi-ts` |

Both backends feed into the same Stage 2 parsers (`src/generators/shared/parsers/`), producing identical `MethodInfo[]` so all templates are shared. The CLI checks for Java and aborts with an install link if `official` is selected without Java present.

**Read more**: [Quick Start - Generator Backends](./docs/QUICK-START.md#generator-backends)

### Two-Stage Generation

```
OpenAPI Spec → [Stage 1: official or heyapi backend] → TypeScript Client
TypeScript Client → [Stage 2: Our Parser + Templates] → Nuxt Composables
```

**Why?** Leverage the mature OpenAPI ecosystem instead of parsing YAML ourselves.

**Read more**: [Architecture - Two-Stage Generation Pattern](./docs/ARCHITECTURE.md#1-two-stage-generation-pattern)

### Wrapper Pattern

```
useFetchAddPet → useApiRequest → useFetch (Nuxt native)
                     ↑
                  Adds: callbacks, auth, interceptors
```

**Why?** Add features (callbacks, auth) without modifying generated code.

**Read more**: [Architecture - Wrapper Pattern](./docs/ARCHITECTURE.md#2-wrapper-pattern)

### Runtime vs Build-time

| Type             | Environment            | Dependencies            |
| ---------------- | ---------------------- | ----------------------- |
| **Build-time**   | CLI tool (Node.js)     | ts-morph, commander     |
| **User runtime** | Nuxt project (browser) | Vue 3, Nuxt composables |

**Why separate?** Runtime files are **copied** to user's project, not imported from npm.

**Read more**: [Quick Start - Runtime vs Build-time](./docs/QUICK-START.md#2-runtime-vs-build-time)

### Global Callbacks System

Define callbacks **once** in a plugin, apply to **all** requests:

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => ({
  provide: {
    getGlobalApiCallbacks: () => ({
      onRequest: (ctx) => {
        /* Add auth */
      },
      onSuccess: (data) => {
        /* Show toast */
      },
      onError: (error) => {
        /* Handle errors */
      },
    }),
  },
}));
```

**Control**: 3 ways to disable (skipGlobalCallbacks, return false, patterns)

**Read more**: [Architecture - Global Callbacks Deep Dive](./docs/ARCHITECTURE.md#global-callbacks-deep-dive)

---

## Project Structure Quick Overview

```
nuxt-generator/
├── docs/                          # 📚 Documentation (START HERE)
│   ├── README.md                  # Documentation index
│   ├── QUICK-START.md             # 5-minute overview
│   ├── ARCHITECTURE.md            # Design patterns & ADRs
│   ├── API-REFERENCE.md           # Complete technical reference
│   ├── DEVELOPMENT.md             # How to contribute
│   └── TROUBLESHOOTING.md         # Problem solving
│
├── src/                           # Source code
│   ├── index.ts                   # ⭐ CLI entry point
│   ├── generate.ts                # OpenAPI Generator wrapper
│   └── generators/
│       ├── shared/                # Common code
│       │   ├── types.ts           # MethodInfo, ApiClassInfo
│       │   ├── runtime/           # Copied to output
│       │   │   └── apiHelpers.ts  # Callbacks, auth, transforms
│       │   └── templates/
│       │       └── api-callbacks-plugin.ts  # Global callbacks template
│       │
│       ├── use-fetch/             # ⭐ Main generator
│       │   ├── parser.ts          # Extract API info (ts-morph)
│       │   ├── templates.ts       # Generate composables
│       │   ├── generator.ts       # Orchestration
│       │   └── runtime/
│       │       └── useApiRequest.ts  # Wrapper (copied to user)
│       │
│       ├── use-async-data/        # useAsyncData generator
│       └── nuxt-server/           # Server routes generator
│
├── README.md                      # User-facing documentation
├── CONTRIBUTING.md                # Contribution guidelines
├── INSTRUCTIONS.md                # This file (documentation index)
└── package.json
```

---

## Migration Guide (Old INSTRUCTIONS.md → New docs/)

If you're looking for content from the old `INSTRUCTIONS.md` file, here's where it moved:

| Old Section                    | New Location                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Project Overview               | [Quick Start - What is this?](./docs/QUICK-START.md#what-is-this)                          |
| Project Structure              | [Quick Start - Project Structure](./docs/QUICK-START.md#project-structure-overview)        |
| Technology Stack               | [Quick Start - Technology Stack](./docs/QUICK-START.md#technology-stack-quick-ref)         |
| Architecture & Design Patterns | [Architecture Documentation](./docs/ARCHITECTURE.md)                                       |
| Two-Stage Generation           | [Architecture - Two-Stage](./docs/ARCHITECTURE.md#1-two-stage-generation-pattern)          |
| Wrapper Pattern                | [Architecture - Wrapper](./docs/ARCHITECTURE.md#2-wrapper-pattern)                         |
| Parser Architecture            | [Architecture - ADR-001](./docs/ARCHITECTURE.md#adr-001-use-ts-morph-instead-of-regex)     |
| Template-Based Generation      | [Architecture - Template Pattern](./docs/ARCHITECTURE.md#4-template-based-code-generation) |
| Runtime Design                 | [Quick Start - Runtime vs Build-time](./docs/QUICK-START.md#2-runtime-vs-build-time)       |
| Global Callbacks System        | [Architecture - Global Callbacks](./docs/ARCHITECTURE.md#global-callbacks-deep-dive)       |
| Testing Strategy               | [Development - Testing](./docs/DEVELOPMENT.md#testing-changes)                             |
| Common Pitfalls                | [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)                                         |
| BFF Architecture               | [Architecture - BFF](./docs/ARCHITECTURE.md) + [README - BFF](./README.md)                 |
| Code Style & Conventions       | [Development - Code Style](./docs/DEVELOPMENT.md#code-style)                               |
| CLI Design Principles          | [API Reference - CLI Commands](./docs/API-REFERENCE.md#cli-commands)                       |
| Interfaces & Types             | [API Reference - Interfaces](./docs/API-REFERENCE.md#interfaces--types)                    |
| Parser API                     | [API Reference - Parser API](./docs/API-REFERENCE.md#parser-api)                           |
| Template API                   | [API Reference - Template API](./docs/API-REFERENCE.md#template-api)                       |
| Runtime APIs                   | [API Reference - Runtime APIs](./docs/API-REFERENCE.md#runtime-apis)                       |

---

## ⚠️ Important: Always Build Before Testing

After editing any file in `src/`, you **must** run the build before testing changes:

```bash
npm run build
```

This compiles TypeScript from `src/` to JavaScript in `dist/`. The CLI (`nxh` / `node dist/index.js`) runs from `dist/` — **without rebuilding, your changes have no effect**.

**Full cycle:**

```bash
# 1. Edit files in src/
# 2. Build
npm run build
# 3. Test
node dist/index.js generate -i swagger.yaml -o ./swagger
```

See [Development Workflow](./docs/DEVELOPMENT.md#development-workflow) for the full step-by-step guide.

---

## Glossary

Quick reference for technical terms used throughout the documentation:

- **Two-Stage Generation**: OpenAPI → TypeScript Fetch → Nuxt Composables
- **Wrapper Pattern**: Generated composables call runtime wrappers (useApiRequest, useApiAsyncData)
- **Runtime Files**: Code copied to user's project (not imported from npm package)
- **Build-time Runtime**: Environment where CLI tool runs (Node.js, ts-morph, commander)
- **User Runtime**: Environment where generated code runs (Vue 3, Nuxt composables, browser/SSR)
- **MethodInfo**: TypeScript interface containing all extracted data about an API endpoint
- **ApiClassInfo**: Interface grouping all methods from a single API class
- **Parser**: Code using ts-morph to extract API information from TypeScript files
- **Template**: Functions that generate composable code from MethodInfo
- **Generator**: Orchestrator that calls parser, templates, and writes files
- **Global Callbacks**: Callbacks defined once in a plugin that apply to all API requests
- **BFF**: Backend for Frontend - pattern separating routing from business logic
- **Raw Composables**: useAsyncData composables that return full response (data + headers + status)
- **Normal Composables**: Standard composables that return only data
- **ADR**: Architectural Decision Record - document explaining why a design choice was made
- **SSR**: Server-Side Rendering - Nuxt's ability to render pages on the server
- **AST**: Abstract Syntax Tree - tree representation of TypeScript code structure
- **Dual Composables**: Pattern where both normal and raw versions are generated

---

## Getting Help

### Documentation Issues

If you can't find what you're looking for or the documentation is unclear:

1. Check the [Documentation Index](./docs/README.md)
2. Use the "By Task" navigation table above
3. Search across all docs (GitHub search: `repo:username/nuxt-generator path:docs/ <your query>`)
4. [Open a documentation issue](https://github.com/dmartindiaz/nuxt-openapi-hyperfetch/issues/new?labels=documentation)

### Technical Support

- **Bug Reports**: [Open an issue](https://github.com/dmartindiaz/nuxt-openapi-hyperfetch/issues/new?template=bug_report.md)
- **Feature Requests**: [Open an issue](https://github.com/dmartindiaz/nuxt-openapi-hyperfetch/issues/new?template=feature_request.md)
- **Questions**: [Start a discussion](https://github.com/dmartindiaz/nuxt-openapi-hyperfetch/discussions)

---

**Ready to dive in?** Start with the [Quick Start Guide](./docs/QUICK-START.md)!
