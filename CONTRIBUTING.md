# Contributing to nuxt-openapi-hyperfetch

This repository now centers on a Nuxt module workflow. Contributions should match the current product shape and the source that exists in this repo today.

## Prerequisites

- Node.js 18+
- npm 9+
- Git
- familiarity with TypeScript, Nuxt, and OpenAPI 3.x

## Local setup

```bash
git clone https://github.com/dmartindiaz/nuxt-openapi-hyperfetch.git
cd nuxt-openapi-hyperfetch
npm install
npm run build
npm run validate
```

## Repository shape

The most relevant areas for contributors are:

- `src/generate.ts` for base `@hey-api/openapi-ts` generation
- `src/generators/` for `useFetch`, `useAsyncData`, `nuxtServer`, connectors, and shared runtime code
- `src/module/` for Nuxt module options and hooks
- `scripts/dev-generate.ts` for local generation smoke tests
- `swagger.yaml` as the local spec used during development
- `openapi/` as generated output used for verification and docs alignment

## Useful commands

### Validation

```bash
npm run build
npm run type-check
npm run lint
npm run format:check
npm run validate
```

### Local generation

```bash
npm run dev:generate:all
npm run dev:generate:openapi
npm run dev:generate:use-fetch
npm run dev:generate:use-async-data
```

Examples:

```bash
npm run dev:generate:all -- --input ./swagger.yaml --output ./openapi
npm run dev:generate:use-fetch -- --skip-openapi
npm run dev:generate:use-async-data -- --base-url https://api.example.com
```

## Contribution guidelines

- keep changes focused on one coherent problem
- fix generator or runtime source, not generated files by hand
- regenerate `openapi/` when your source change affects generated output
- update docs when public behavior, names, paths, or defaults change
- keep examples aligned with the current `openapi` module config and output layout

## Testing expectations

This repository does not currently include a formal in-tree automated test suite.

For most changes, the minimum expectation is:

```bash
npm run build
npm run validate
```

If generation behavior changes, also run the appropriate `dev:generate:*` command and inspect `openapi/`.

## Pull requests

A good pull request should explain:

1. what problem exists
2. what changed
3. how you validated the change
4. whether generated output or docs changed intentionally

Clear, descriptive commit messages are preferred. Conventional Commit style is welcome but not mandatory.

## Documentation

Documentation must be source-verified.

Before merging a docs change, confirm that:

- commands exist in `package.json`
- config keys match `src/module/`
- generated names and paths match `openapi/`
- no removed CLI-era workflow is being reintroduced in examples

## Release note

The repository currently uses a manual release flow centered on `package.json` versioning and `npm publish`. The `prepublishOnly` script already runs `npm run build`.

## More contributor docs

The VitePress contributor section expands on the same workflow:

- `docs/vitepress/contributing/index.md`
- `docs/vitepress/contributing/development.md`
- `docs/vitepress/contributing/testing.md`
- `docs/vitepress/contributing/pull-requests.md`
