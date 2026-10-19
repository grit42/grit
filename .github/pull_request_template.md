<!--
  PR template — applies to every pull request.
  Tick the type of change below and skip any section that doesn't apply
  (e.g. "Motivation" for a trivial fix, or testing/CHANGELOG items for docs-only PRs).
-->

## Type of change

- [ ] Feature
- [ ] Bug fix
- [ ] Documentation only
- [ ] Other (chore, refactor, dependency bump, …)

## Summary

<!-- What does this PR do, and why? One or two sentences is fine. -->

## Motivation / Context

<!-- Why is this needed? For a bug fix, what was broken? For a feature, what does it enable? Omit for trivial changes. -->

## Changes

<!-- Key changes, grouped by component/module if it spans several (e.g. server / client, or core / assays / compounds). -->

## Testing

<!-- How was this verified? Commands run, manual steps, screenshots for UI. For docs-only PRs, note "docs only". -->

## Checklist

- [ ] Tests added/updated where it makes sense (or N/A)
- [ ] API documentation specs added/updated where it makes sense (or N/A)
- [ ] `pnpm nx affected -t lint:check format:check` passes (or N/A — docs only)
- [ ] `pnpm nx release plan:check` passes (or N/A)
- [ ] Documentation in `grit-docs/` updated if behaviour changed
