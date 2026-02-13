# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Grit is a scientific research data management platform for pre-clinical drug discovery. It is a monorepo with an Nx-orchestrated frontend (React/TypeScript/Vite) and a Rails 7.2 backend using PostgreSQL with the RDKit chemical informatics extension.

## Build & Development Commands

```bash
# Install frontend dependencies
pnpm install

# Frontend development (all packages)
pnpm dev

# Build all frontend packages
pnpm build

# Build a specific package
pnpm exec nx build @grit42/core

# Lint and format (frontend)
pnpm lint          # lint and fix
pnpm lint:check    # lint check only
pnpm format        # format and fix
pnpm format:check  # format check only

# Backend (Rails)
cd apps/grit/server
bundle install
rails db:migrate
rails server

# Run Rails tests
cd apps/grit/server && rails test

# Docker (database + app)
docker-compose up
```

## Architecture

### Monorepo Structure

The codebase is split into three layers: **apps**, **modules**, and **packages**.

**apps/grit/** — The main application
- `client/` — React SPA entry point (Vite), served at `/app` by Rails
- `server/` — Rails 7.2 API server, serves the built frontend as static files

**modules/** — Feature modules, each with paired frontend and backend:
- `core/` — User, session, and generic entity management (Authlogic auth)
- `compounds/` — Chemical compound data (uses OpenChemlib/RDKit)
- `assays/` — Experimental/assay data with spreadsheet and plot visualization

**packages/frontend/** — Shared UI libraries (all `@grit42/*` scoped):
- `api/` — React Query + Axios HTTP client
- `client-library/` — Shared React components (has Storybook)
- `form/` — Form components
- `table/` — Table/grid components
- `notifications/` — Toast notification system
- `plots/` — Data visualization
- `spreadsheet/` — Spreadsheet component

### Module Plugin System

Each module exports a standard interface consumed by the main app:
- **meta** — Navigation items and root route
- **provider** — React context provider (wraps the app)
- **registrant** — Side-effect component for registering module capabilities
- **router** — Lazy-loaded route tree

The main app composes modules in `App.tsx` (providers), `Registrant.tsx` (registrations), and `Router.tsx` (routes). To add a new module, follow this same pattern.

### Backend Module Pattern

Backend modules are Rails engines packaged as gems (`grit-core`, `grit-compounds`, `grit-assays`). The main Rails app references them via local paths in its Gemfile. Both `grit-compounds` and `grit-assays` depend on `grit-core`.

### Dependency Hierarchy

```
@grit42/grit (app)
├── @grit42/core → @grit42/{api, client-library, form, table, notifications}
├── @grit42/compounds → @grit42/core + OpenChemlib
└── @grit42/assays → @grit42/core + @grit42/{plots, spreadsheet}
```

### Build Tooling

- **Nx 21** orchestrates builds with caching and dependency-aware task execution
- **pnpm 10** workspaces for frontend package management
- **Vite 5** for frontend builds
- **Custom Nx Ruby plugin** in `tools/ruby/` integrates Rails engine gems into the Nx graph

## Code Style

- **TypeScript/JS**: ESLint 9 + Prettier (80 char width, double quotes, trailing commas, semicolons)
- **Ruby**: RuboCop with Rails Omakase style
- **SCSS** for styling with CSS modules (`*.module.scss`)

## Key Technologies

- **React 18** with React Router 6 and TanStack React Query 5
- **Rails 7.2** with PostgreSQL 16 + RDKit extension
- **Authlogic** for authentication
- **OpenChemlib / react-ocl** for chemical structure rendering
- **Zod** for form validation (in compounds/assays modules)
- **Docusaurus 3** for documentation (`grit-docs/`)
