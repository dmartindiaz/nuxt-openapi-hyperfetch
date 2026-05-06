# Code Style

This page summarizes the style rules that matter most when contributing to the current repository.

## Ground rules

- keep changes small and local to the real problem
- match existing naming and file structure
- prefer straightforward TypeScript over clever abstractions
- update docs when public behavior changes
- fix generator source or shared runtime, not generated files by hand

## Formatting

Prettier is the source of truth for formatting.

Current repository formatting:

- semicolons enabled
- single quotes
- trailing commas in ES5 positions
- `printWidth: 100`
- two-space indentation
- LF line endings

Use these commands when needed:

```bash
npm run format
npm run format:check
```

## Linting

ESLint is configured with TypeScript type-aware rules.

Use:

```bash
npm run lint
npm run lint:fix
```

Important enforced rules in the current config include:

- no unused variables unless prefixed with `_`
- `prefer-const`
- `no-var`
- `eqeqeq`
- `curly`
- no floating promises
- limited use of `@ts-ignore` and similar comments

Some `unsafe-*` TypeScript rules are intentionally relaxed for `src/module/**` because Nuxt types resolve differently there.

## TypeScript style

- keep `strict` mode assumptions intact
- prefer explicit domain types over `any`
- use `unknown` when the value is genuinely unknown
- convert route params and external values explicitly instead of relying on coercion
- prefer option objects when a function needs many related inputs

## Naming

Use the existing repository conventions:

- `camelCase` for functions and variables
- `PascalCase` for exported types and interfaces
- clear generator names that match the product surface
- public config should use current OpenAPI terminology, not removed legacy names

## Imports

Keep imports readable and stable.

A good default order is:

1. Node built-ins
2. external packages
3. local project modules
4. type-only imports

Follow the surrounding file when the repository already has a settled pattern.

## Comments

Comments should explain intent, constraints, or tricky behavior.

Avoid comments that merely restate obvious code.

Good places for short comments in this repository:

- why a runtime fallback exists
- why a Nuxt module rule is relaxed
- why a generator preserves a compatibility behavior

## Generated code rules

Do not hand-edit generated files as the real fix.

If you regenerate output as part of a change, the generated diff should be the consequence of changes in:

- `src/generate.ts`
- `src/generators/**`
- `src/config/**`
- `src/module/**`

## Documentation-aware coding

Public names in code and docs should stay aligned. In this repository that usually means:

- `openapi` as the module config key
- `openapi/` as the default output root
- `runtimeConfig.public.apiBaseUrl` for client fallback
- `server/routes/api` as the default `nuxtServer` route output

## Related pages

- [Development setup](/contributing/development)
- [Documentation standards](/contributing/documentation)
- [Pull requests](/contributing/pull-requests)
