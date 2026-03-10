# AGENTS.md

grit is a scientific research data management platform.

## Plan mode

When writing plans, be extremely concise. Sacrifice grammar for the sake of concision.
At the end of each plan, list unresolved questions. Ask about edge cases, error handling, and unclear requirements before proceeding.
End every plan with a numbered list of concrete steps. This should be the last thing visible in the terminal.
For large changes, persist the plan in a markdown file with a descriptive name in `.plans`

## Monorepo Structure

Three layers: **apps**, **modules**, and **packages**.

- `apps/grit/client/` — React SPA entry point (Vite), served at `/app` by Rails
- `apps/grit/server/` — Rails API server, thin shell with zero business logic, just serves the SPA and loads engine gems
- `modules/{core,compounds,assays}/` — Feature modules, each with paired `frontend/` and `backend/` directories
- `packages/frontend/` — Shared UI libraries (all `@grit42/*` scoped): api, client-library, form, table, notifications, plots, spreadsheet

## Module system

grit is built around the concept of modular monolith.

Features modules (under `modules/`) are developed in isolation and have no hard dependency on each other, at the exception to the core module which provides common behaviour and must be used by other feature modules. Each module has dummy applications for both frontend and backend under `modules/<module name>/{backend,frontend}/test/dummy` for development and testing.

Apps (under `apps`) only provide a shell for composing feature modules and do not have any business logic.

## Commands

All tasks run through Nx. Never run build/test/lint directly — always use `pnpm nx`.

```bash
# Frontend
pnpm nx run-many -t build                       # build all frontend packages
pnpm nx build @grit42/core                      # build a specific package (+ deps)

# Backend
pnpm nx test grit-core                          # run minitest for core engine
pnpm nx run-many -t test --projects=grit-core,grit-compounds,grit-assays  # all backend tests

# E2E (Playwright)
pnpm nx run @grit42/core:test:e2e --workers 1  # run Playwright tests

# Dev database
docker compose -f db/docker-compose.yml up      # start PostgreSQL+RDKit (host network, port 5432)
```

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
