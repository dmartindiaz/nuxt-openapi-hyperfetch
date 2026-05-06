# Testing Expectations

This repository does not currently ship a formal automated test suite, fixture matrix, or coverage pipeline in-tree.

That means contributor testing is currently centered on build validation and generation smoke tests.

## Minimum validation for most changes

Run these before opening a pull request:

```bash
npm run build
npm run validate
```

`npm run validate` currently runs:

- `npm run type-check`
- `npm run lint`
- `npm run format:check`

## Generation smoke tests

If your change affects generated output, also run the relevant generation command.

```bash
npm run dev:generate:openapi
npm run dev:generate:use-fetch
npm run dev:generate:use-async-data
npm run dev:generate:all
```

Use `swagger.yaml` as the default local contract unless your change requires a more specific reproduction.

## What to check after regeneration

After regenerating, inspect `openapi/` for the behavior you expected.

Examples:

- new operation naming or parameter handling appears in generated exports
- runtime warning text matches current configuration keys
- composable signatures still align with exported types from `~/openapi`
- docs examples still match the generated symbol names

## Change-specific expectations

### Generator changes

If you touch `src/generators/**`, validate the affected output and describe what changed in the pull request.

### Shared runtime changes

If you touch runtime helpers, test both happy path and failure behavior where possible, especially:

- missing base URL warnings
- header and callback hooks
- request parameter shaping
- cache key or reactive parameter behavior

### Module changes

If you touch `src/module/**`, validate the defaults and option names against the current docs and confirm the build hooks still behave correctly.

## Manual integration testing

For changes that are hard to validate from generated files alone, a small external Nuxt sandbox is still a good manual test strategy.

Typical cases:

- auto-import behavior
- module hook timing in `nuxt dev`
- Nitro route output from `nuxtServer`
- connector ergonomics inside a real app

That sandbox is not part of this repository, so summarize the manual steps you used in the pull request.

## If you add automated tests

Automated tests are welcome, but they should match the actual architecture of the current repository.

Good additions would focus on:

- small deterministic generator outputs
- config normalization
- runtime helper behavior that does not depend on a full Nuxt app
- regression cases that were previously broken

Avoid introducing a large test harness unless the change clearly justifies the maintenance cost.

## Pull request notes

If a change was tested manually, include:

1. what command you ran
2. which files or output you inspected
3. what behavior you confirmed
4. anything you could not verify inside this repository

## Related pages

- [Development setup](/contributing/development)
- [Pull request guide](/contributing/pull-requests)
