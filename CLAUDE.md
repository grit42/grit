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

Backend modules are Rails engines packaged as gems (`grit-core`, `grit-compounds`, `grit-assays`). The main Rails app at `apps/grit/server/` is a **thin shell** — it has no `app/` directory and zero business logic. It only:
- Serves the built React SPA at `/app` and `/` (via lambda routes)
- Serves docs at `/docs`
- Loads the three engine gems via `Bundler.require(*Rails.groups, :local)` with local paths in its Gemfile
- Runs database migrations/seeds from engines (via `bin/docker-entrypoint`)

Each engine **self-mounts** via an initializer in its `engine.rb` — the main app doesn't need to configure routes or mount points. Engines also auto-append their own migrations and seeds to the host app.

**Database**: PostgreSQL with RDKit extension. All migrations originate from engines (~45 total). Tables are prefixed by module (`grit_core_*`, `grit_compounds_*`, `grit_assays_*`). All tables have audit triggers via `manage_stamps()` and custom ID generation via `grit_seq`.

**API Routes**:
```
/api/grit_core/*       — Core: users, sessions, entities, vocabularies, load sets
/api/grit/compounds/*  — Compounds: compounds, batches, molecules, synonyms, types
/api/grit/assays/*     — Assays: experiments, models, data sheets, data tables, metadata
```

### Backend Core Frameworks (in grit-core)

All backend modules build on these shared frameworks from `modules/core/backend/`:

- **GritEntityRecord** concern (`app/models/concerns/grit/core/grit_entity_record.rb`) — Include in any model for: auto-validation from DB schema, declarative CRUD permissions via `entity_crud_with`, audit fields (`created_by`/`updated_by`), `detailed()` scope with LEFT JOINs for FK display, `display_column(s)` for FK resolution, `entity_properties`/`entity_fields`/`entity_columns` for dynamic UI generation.

- **GritEntityController** concern (`app/controllers/concerns/grit/core/grit_entity_controller.rb`) — Include in any controller for: unified CRUD with filtering/sorting via `FilterProvider`, paginated index (cursor/limit/offset), CSV export via PostgreSQL `COPY`, role-based permission checks (`check_read`/`check_create`/`check_update`/`check_destroy`).

- **FilterProvider** (`lib/grit/core/filter_provider.rb`) — Pluggable filter system with type-based operators (eq, ne, contains, regexp, in_list, etc). Uses prepared statements.

- **EntityMapper** (`lib/grit/core/entity_mapper.rb`) — Runtime model discovery; caches table-to-model and model-to-table mappings.

- **EntityLoader** (`lib/grit/core/entity_loader.rb`) — Pluggable bulk import pipeline: upload CSV/SDF → parse columns → user maps fields → validate → confirm (transactional) → rollback support. Delegates to entity-specific loaders via `"#{entity}Loader".constantize`.

- **Authentication** — Authlogic with SCrypt hashing. Cookie-based sessions (`grit_core_user_credentials`). Two-factor support. `User.current` via RequestStore for request-scoped user context. Role-based authorization checked at entity level. Key endpoints: `POST /api/grit_core/user_sessions` (login), `GET /api/grit_core/user_session` (session info), `DELETE /api/grit_core/user_session` (logout).

### Backend Module Details

**grit-core** (`modules/core/backend/`) — 19 models, 19 controllers, 19 migrations
- Users, roles, sessions (Authlogic), countries, origins, locations, units, data types, vocabularies, publication statuses, load sets/blocks
- Provides the generic entity framework and authentication used by all modules

**grit-compounds** (`modules/compounds/backend/`) — 14 models, 8 controllers, 12 migrations
- Compounds (auto-numbered `GRIT-*`), batches (`BATCH-*`), molecules, synonyms
- Compound/batch types with dynamic custom properties (`CompoundProperty`/`CompoundPropertyValue`)
- RDKit integration: `rdkit_mol` column with GiST index on molecules table. `update_rdkit_mol_column` trigger auto-computes molweight, logp, inchi, inchikey, canonical_smiles, hba, hbd from molfile
- SDF file parser (`lib/grit/compounds/sdf.rb`) for structure import
- Structure deduplication via SMILES matching; `molecule_exists` endpoint for uniqueness checks

**grit-assays** (`modules/assays/backend/`) — 17 models, 15 controllers, 14 migrations
- Experiments, assay models/types, metadata definitions (vocabulary-backed)
- **Dynamic table generation**: `AssayDataSheetDefinition` creates runtime tables `ds_{id}` with typed columns matching `AssayDataSheetColumn` definitions. `sheet_record_klass()` generates model classes at runtime. Dynamic tables excluded from `schema.rb` via `SchemaDumper.ignore_tables`
- Publication workflow: Draft → Published (published records become immutable)
- Export as ZIP of CSVs (one per data sheet, via `rubyzip`)

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
