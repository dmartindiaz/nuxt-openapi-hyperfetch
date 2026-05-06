# Current Priorities

This repository does not currently expose a formal public roadmap file backed by active automation or milestone tooling in-tree.

This page is intentionally narrower: it describes the contribution areas that best match the current codebase.

## High-value areas

### Keep the Nuxt module coherent

Contributions are valuable when they make the module behavior more predictable:

- clearer option defaults
- better build-hook behavior
- more reliable auto-import behavior
- fewer mismatches between docs and implementation

### Improve generated client output

The current product depends heavily on generated SDK and composable quality.

Good contribution areas include:

- stronger operation naming behavior
- safer parameter shaping
- clearer runtime warnings
- fewer generated edge-case regressions

### Improve `nuxtServer` and connectors

These are the most behavior-rich generators in the repository.

Useful work includes:

- cleaner server route generation
- better BFF scaffolding defaults
- clearer connector contracts
- stronger runtime ergonomics for CRUD flows

### Keep docs source-verified

Documentation drift has historically been a real maintenance cost in this repository.

Contributions that remove stale assumptions and align docs with `src/` and `openapi/` are high value.

## What is not a good roadmap assumption

Do not assume unfinished ideas are already project commitments unless they are implemented in the source.

Examples of bad assumptions:

- a contributor-facing CLI workflow still exists
- an in-repo automated test matrix already exists
- a formal release automation pipeline is already wired in the repo
- future feature ideas are guaranteed simply because they were written in old docs

## How to propose a larger direction

If you want to propose a larger change:

1. define the user problem first
2. explain how it fits the current Nuxt-only product shape
3. identify which generators, runtime helpers, or docs would change
4. split the work into reviewable steps whenever possible

## Good large-change themes

Large proposals are easier to evaluate when they improve one of these:

- correctness of generated output
- consistency between config, runtime, and docs
- maintainability of shared generator code
- developer ergonomics without reintroducing obsolete product shapes

## Related pages

- [Contributing](/contributing/)
- [Development setup](/contributing/development)
- [Release process](/contributing/release-process)
