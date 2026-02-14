# CLAUDE.md

Grit is a scientific research data management platform for pre-clinical drug discovery. Monorepo with an Nx-orchestrated React/TypeScript/Vite frontend and a Rails 7.2 backend using PostgreSQL with the RDKit chemical informatics extension.

## Commands

```bash
# Frontend
pnpm install              # install dependencies
pnpm dev                  # dev server (all packages)
pnpm build                # build all packages
pnpm exec nx build @grit42/core  # build a specific package
pnpm lint                 # lint and fix
pnpm lint:check           # lint check only
pnpm format               # format and fix
pnpm format:check         # format check only

# Backend (from apps/grit/server/)
bundle install
rails db:migrate
rails server
rails test

# Docker
docker-compose up
```

## Monorepo Structure

Three layers: **apps**, **modules**, and **packages**.

- `apps/grit/client/` — React SPA entry point (Vite), served at `/app` by Rails
- `apps/grit/server/` — Rails API server, thin shell with zero business logic, just serves the SPA and loads engine gems
- `modules/{core,compounds,assays}/` — Feature modules, each with paired `frontend/` and `backend/` directories
- `packages/frontend/` — Shared UI libraries (all `@grit42/*` scoped): api, client-library, form, table, notifications, plots, spreadsheet

## Architecture Decisions

### Module plugin system
Each frontend module exports a `GritModule` interface (meta, provider, registrant, router). The main app composes them in `App.tsx`, `Provider.tsx`, `Registrant.tsx`, and `Router.tsx`. To add a new module, follow this same pattern.

### Provider nesting order matters
In `apps/grit/client/src/Provider.tsx`, the order is load-bearing:
```
FormInputProvider → ColumnTypeDefProvider → CoreProvider → CompoundsProvider → AssaysProvider
```

### Backend engines self-mount
Backend modules are Rails engines as gems (`grit-core`, `grit-compounds`, `grit-assays`). Each engine self-mounts via an initializer in its `engine.rb` — the main app doesn't configure routes or mount points. Engines auto-append their own migrations and seeds.

### Dynamic assay tables
`AssayDataSheetDefinition` creates runtime tables `ds_{id}` with typed columns. `sheet_record_klass()` generates model classes at runtime. These tables are excluded from `schema.rb` via `SchemaDumper.ignore_tables` — don't remove that exclusion.

### Extension registries
Modules extend core behavior through React Context registries in their Registrant component:
- `useRegisterEntityForm(entityType, Component)` — custom entity forms
- `useRegisterImporter(entity, importerComponents)` — custom importers
- `useRegisterAdministrationTabs(tabs)` — admin panel tabs
- `useRegisterFormInput(type, Component)` — custom form input types (e.g., "mol")
- `useRegisterColumnTypeDef(type, def)` — custom table column types (e.g., "mol")

### Entity CRUD pattern (used everywhere)
- **List**: `useInfiniteEntityData()` → `Table` with infinite scroll
- **Detail**: `useEntityDatum(path, id)` + `useEntityFields()` → `Form`. ID `"new"` = create mode
- **Mutations**: `useCreateEntityMutation` (POST), `useEditEntityMutation` (PATCH), `useDestroyEntityMutation` (DELETE)

### Backend entity framework (in grit-core)
All models use `GritEntityRecord` concern (auto-validation, CRUD permissions via `entity_crud_with`, audit fields, `detailed()` scope, `entity_properties`/`entity_fields`/`entity_columns` for dynamic UI generation). All controllers use `GritEntityController` concern (unified CRUD, filtering via `FilterProvider`, pagination, CSV export, role-based permissions).

### Database conventions
Tables are prefixed by module (`grit_core_*`, `grit_compounds_*`, `grit_assays_*`). All tables have audit triggers via `manage_stamps()` and custom ID generation via `grit_seq`. Migrations originate from engine gems, not the main app.

## Code Style

- **TypeScript**: ESLint 9 (flat config) + Prettier (80 char width, double quotes, trailing commas, semicolons). `@typescript-eslint/no-explicit-any` = "warn"
- **Ruby**: RuboCop with Rails Omakase style
- **SCSS**: CSS modules (`*.module.scss`), camelCase convention for class name access
- **Frontend features** follow: `queries.ts` (React Query reads), `mutations.ts` (writes), `types.ts`, `pages/`, `components/`
- **Vite library builds**: Each package/module uses `vite-plugin-dts`, `vite-plugin-lib-inject-css`, and `vite-plugin-externalize-deps`
- **Package versions**: Managed via `catalog:` in `pnpm-workspace.yaml`
