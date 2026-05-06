# Pull Requests

This page describes the expectations for pull requests against the current repository.

## Scope

Prefer focused pull requests.

Good pull requests usually do one of these:

- fix a single generator or runtime issue
- add a narrowly scoped feature behind the current module model
- clean up internal architecture without changing public behavior
- update docs to match verified source behavior

## Branching

Use a descriptive branch name based on the change:

- `feature/add-connector-option`
- `fix/use-async-data-cache-key`
- `docs/rewrite-contributing-guide`
- `refactor/shared-runtime-cleanup`

## Before opening the PR

Run the checks that match your change.

Minimum for most code changes:

```bash
npm run build
npm run validate
```

If generation behavior changed, also regenerate the affected output and inspect `openapi/`.

## What reviewers need to see

A good pull request description should answer four things clearly:

1. what problem exists today
2. what changed in the implementation
3. how you validated the change
4. whether any docs or generated output changed intentionally

## Commit messages

Use direct, descriptive commit messages.

Examples:

```bash
git commit -m "fix: preserve baseURL fallback in async data runtime"
git commit -m "docs: rewrite contributing section for Nuxt-only workflow"
git commit -m "refactor: simplify generator option normalization"
```

Conventional Commit style is welcome, but the important part is clarity.

## Review checklist

Before requesting review, make sure:

- the change is scoped and readable
- generated output was refreshed when needed
- docs were updated when public behavior changed
- no stale references to removed CLI-era behavior were introduced
- build and validation commands pass locally

## Common reasons for review feedback

- docs describe behavior that the current source does not implement
- generated code changed but the source explanation is missing
- a fix patches generated output instead of fixing the generator or shared runtime
- a public option or path was renamed without updating docs and examples
- unrelated refactors were mixed into a functional fix

## Large changes

If the change is big, split it into a small sequence of reviewable pull requests whenever possible.

Good split examples:

- source migration first, docs rewrite second
- config normalization first, generator output updates second
- runtime fix first, connector follow-up second

## Responding to review

When feedback arrives:

- address the requested change directly
- explain tradeoffs when you disagree
- keep follow-up commits focused on the review topic
- update docs if the review changed user-facing behavior

## What to include when manual testing was required

If you used a local Nuxt sandbox or other manual verification, say so explicitly in the PR description.

A short note is enough:

```md
Validated with `npm run dev:generate:all` and a local Nuxt sandbox.
Confirmed auto-imports, `apiBaseUrl` fallback, and regenerated `openapi/` output.
```

## Related pages

- [Development setup](/contributing/development)
- [Testing expectations](/contributing/testing)
- [Documentation standards](/contributing/documentation)
