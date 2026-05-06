# Contributing

This section explains how to contribute to the current Nuxt-only version of `nuxt-openapi-hyperfetch`.

## What contributions help most

- fix bugs in generation, runtime helpers, or module wiring
- improve generated output for `useFetch`, `useAsyncData`, `nuxtServer`, or connectors
- tighten documentation so it matches the current codebase
- simplify internal architecture without changing user-facing behavior unexpectedly

## Before you start

Contributors should be comfortable with:

- Node.js 18+
- TypeScript
- Nuxt module basics
- OpenAPI 3.x contracts

Install and validate the repository locally:

```bash
npm install
npm run build
npm run validate
```

## Current repository shape

The project no longer exposes a contributor-facing CLI workflow. The main product is a Nuxt module that:

- generates the base SDK and types into `openapi/`
- generates optional `useFetch` and `useAsyncData` composables
- can generate `nuxtServer` Nitro routes
- can generate headless CRUD connectors

Useful contributor entry points:

- `src/generate.ts` builds the base `@hey-api/openapi-ts` output
- `src/generators/` contains higher-level generators
- `src/module/` contains Nuxt module setup and options
- `scripts/dev-generate.ts` is the local development harness for generation work
- `swagger.yaml` is the local spec used for iteration
- `openapi/` is the generated output used for smoke testing and docs validation

## Recommended contribution flow

1. create a focused branch from the latest `main`
2. make the smallest coherent change that fixes the issue
3. regenerate local output if your change affects generated files
4. run build and validation commands
5. update docs when public behavior changes
6. open a pull request with a clear problem statement and test notes

## Quick links

- [Development setup](/contributing/development)
- [Code style](/contributing/code-style)
- [Testing expectations](/contributing/testing)
- [Documentation standards](/contributing/documentation)
- [Pull request guide](/contributing/pull-requests)
- [Release process](/contributing/release-process)
- [Current priorities](/contributing/roadmap)

## License

By contributing, you agree that your contributions are licensed under the same Apache-2.0 license used by this repository.
