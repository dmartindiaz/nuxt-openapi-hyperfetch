# Documentation Standards

Documentation in this repository is expected to be source-verified, not aspirational.

## Primary rule

If a docs sentence cannot be justified from the current repository behavior, do not publish it.

That matters especially in this project because old documentation can easily drift into:

- removed CLI workflows
- old output paths
- outdated composable names
- stale config keys
- roadmap items already completed or abandoned

## What good docs should do

Good docs in this repository should:

- describe the current Nuxt module workflow
- match the names and defaults in `src/module/`
- match the generated symbols and paths in `openapi/` when examples depend on output
- explain tradeoffs without inventing features that do not exist
- prefer concise examples that still reflect the real API surface

## Sources to verify against

When editing docs, check against the actual source of truth:

- `src/module/` for public module options and defaults
- `src/config/` for generator selection and normalization rules
- `src/generators/` for generated behavior
- `openapi/` for checked-in generated names and import paths
- `package.json` for scripts and supported contributor commands

## Example quality

Examples should be realistic and current.

Prefer examples like:

```ts
import { useAsyncDataGetPetById } from '~/openapi/composables/use-async-data'
import type { GetPetByIdData } from '~/openapi'
```

Avoid examples that depend on removed paths or legacy naming.

## Writing style

Use a style that is:

- direct
- specific
- concise
- technically falsifiable

Prefer:

- present tense
- active voice
- concrete config names and paths
- short paragraphs and examples

## When docs must change with code

Update docs in the same change when you modify:

- public config names
- defaults
- output paths
- generated composable naming
- runtime warnings or fallback behavior
- connector behavior that users are expected to rely on

## VitePress page shape

A good page usually has:

1. a short statement of what the page covers
2. the current default behavior
3. one or two minimal examples
4. links to related sections

## Documentation review checklist

Before finishing a docs change, check:

1. every command exists in `package.json`
2. every file path exists in the repo or generated output being documented
3. every config key matches the current source
4. examples do not rely on removed CLI-era behavior
5. troubleshooting guidance points to current module concepts

## Related pages

- [Code style](/contributing/code-style)
- [Testing expectations](/contributing/testing)
