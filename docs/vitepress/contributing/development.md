# Development Setup

This page covers the real local workflow for contributing to the current repository.

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- Git
- working knowledge of TypeScript and Nuxt

## Initial setup

```bash
git clone https://github.com/dmartindiaz/nuxt-openapi-hyperfetch.git
cd nuxt-openapi-hyperfetch
npm install
npm run build
npm run validate
```

## Project map

The most relevant directories today are:

```text
src/
  config/        Shared generator and connector config helpers
  generators/    useFetch, useAsyncData, nuxtServer, connectors, shared runtime
  module/        Nuxt module entrypoint and module options
  utils/         Shared logging and helper utilities
scripts/
  dev-generate.ts  Local generation harness for contributor workflows
openapi/
  Generated SDK, types, and local smoke-test output
swagger.yaml
  Local OpenAPI document used for development iteration
```

## Commands that matter

### Validation

```bash
npm run build
npm run type-check
npm run lint
npm run format:check
npm run validate
```

`npm run validate` is the main pre-PR gate in the current repo.

### Local generation

Use the dev harness instead of old CLI examples.

```bash
npm run dev:generate:all
npm run dev:generate:openapi
npm run dev:generate:use-fetch
npm run dev:generate:use-async-data
```

Useful options:

```bash
npm run dev:generate:all -- --input ./swagger.yaml --output ./openapi
npm run dev:generate:use-fetch -- --skip-openapi
npm run dev:generate:use-async-data -- --base-url https://api.example.com
```

## Typical development loops

### Working on base OpenAPI output

If you change `src/generate.ts` or anything related to the raw SDK/types output:

```bash
npm run dev:generate:openapi
```

### Working on `useFetch`

If you change files under `src/generators/use-fetch/`:

```bash
npm run dev:generate:use-fetch
```

### Working on `useAsyncData`

If you change files under `src/generators/use-async-data/`:

```bash
npm run dev:generate:use-async-data
```

### Working across generators

If you touch shared parser or runtime code, rebuild everything:

```bash
npm run dev:generate:all
```

## When to update generated output

Regenerate `openapi/` whenever you change:

- base OpenAPI generation
- generator templates
- shared runtime helpers used by generated composables
- operation naming behavior
- docs that rely on checked-in generated examples

If your change is internal and does not affect generated output, explain that in the pull request.

## Module-focused changes

When editing `src/module/` or `src/config/`, verify:

- the option name matches current public docs
- defaults in the docs match the source
- auto-import and build-hook behavior still make sense in `nuxt dev` and `nuxt build`

## Debugging tips

- keep `swagger.yaml` small enough to reproduce the issue quickly
- compare `src/` changes with the regenerated `openapi/` output immediately
- prefer fixing the generator or runtime source, not patching generated files by hand
- if behavior changed intentionally, update the relevant docs page in the same change

## Recommended editor setup

The repo already includes `.editorconfig`, ESLint, and Prettier config. Any editor is fine as long as it respects those settings.

In VS Code, enabling format-on-save and ESLint fixes on save is enough for most contributor work.

## Related pages

- [Code style](/contributing/code-style)
- [Testing expectations](/contributing/testing)
- [Pull request guide](/contributing/pull-requests)
