# Release Process

This page documents a conservative manual release flow based on what currently exists in the repository.

## Current release facts

The repository currently has:

- versioning in `package.json`
- a `prepublishOnly` script that runs `npm run build`
- no checked-in `CHANGELOG.md`
- no checked-in GitHub workflow files in this repository snapshot

That means releases should be treated as a manual maintainer workflow unless automation is added explicitly.

## Basic release flow

1. make sure the branch to release is up to date
2. run local validation
3. bump the package version
4. create or review the git tag
5. publish to npm
6. publish release notes wherever the project is communicating releases

## Pre-release checks

Run at minimum:

```bash
npm install
npm run build
npm run validate
```

If the release includes generation changes, also run the relevant local generation command and inspect the resulting output.

## Version bump

Use standard npm versioning commands.

```bash
npm version patch
npm version minor
npm version major
```

These update `package.json` and create the corresponding git tag and version commit unless local npm config has been changed.

## Publishing

The repository already enforces a build before publish through `prepublishOnly`.

Typical publish step:

```bash
npm publish
```

If you need a pre-release channel, use npm dist-tags explicitly.

## Release notes

Because there is no checked-in changelog file in the current repo snapshot, release notes should be assembled from the merged changes themselves.

A good release summary should cover:

- user-facing fixes
- new module or generator behavior
- breaking changes
- required migration notes
- docs updates that matter for adopters

## When a release should be avoided

Do not cut a release if:

- docs still describe removed behavior
- generated output is stale relative to the merged source
- version bump is not aligned with the real impact of the change
- manual validation has not been completed for risky generator changes

## Breaking changes

Breaking changes need explicit migration guidance.

At minimum, document:

- the old behavior
- the new behavior
- the config or path changes required to migrate
- whether existing generated output must be deleted and regenerated

## Maintainer note

If release automation, CI, or a formal changelog is added later, this page should be updated immediately so contributors are not following a half-manual process.

## Related pages

- [Pull requests](/contributing/pull-requests)
- [Current priorities](/contributing/roadmap)
