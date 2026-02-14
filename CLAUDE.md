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

### Frontend App Shell (`apps/grit/client/`)

The React SPA is a **thin composition shell** with zero business logic. It only wires together the three feature modules:

**Entry point** (`src/main.tsx`): Mounts `AppWrapper` into `<div id="root">`. In production, redirects `/` to `/app` (Rails serves the SPA at `/app`).

**Composition hierarchy** (`src/App.tsx`):
```
StrictMode → HelmetProvider → QueryClientProvider
  → Provider.tsx (nested context providers)
    → Registrant.tsx (side-effect registrations)
    → BrowserRouter (basename="/app")
      → App (session check → ThemeProvider → Header + Toolbar + Router)
```

**Provider nesting order** (`src/Provider.tsx`) — order matters for dependency:
```
FormInputProvider (@grit42/form)
  → ColumnTypeDefProvider (@grit42/table)
    → CoreProvider (@grit42/core)
      → CompoundsProvider (@grit42/compounds)
        → AssaysProvider (@grit42/assays)
```

**Route composition** (`src/Router.tsx`) — lazy-loaded with Suspense:
```
/core/*       → CoreRouter
/compounds/*  → CompoundsRouter
/assays/*     → AssaysRouter
/*            → Navigate to "compounds" (default)
```

**Navigation items** assembled in App.tsx: `[...CompoundsMeta.navItems, ...AssaysMeta.navItems, ...CoreMeta.navItems]`

**Styling**: SCSS with CSS modules (`*.module.scss`). Vite generates scoped class names: `grit-{filename}__{classname}` in dev, `[hash:base64:16]` in prod. Custom fonts: Guardian (headings/buttons) and Sintony (body).

### Module Plugin System

Each module exports a standard `GritModule` interface consumed by the main app:
- **meta** — Navigation items and root route (e.g., `rootRoute: "/compounds"`)
- **provider** — React context provider (wraps the app for module-specific contexts)
- **registrant** — Side-effect component that registers forms, column types, importers
- **router** — Lazy-loaded route tree (code-split per module)

The main app composes modules in `App.tsx` (navigation), `Provider.tsx` (context providers), `Registrant.tsx` (registrations), and `Router.tsx` (routes). To add a new module, follow this same pattern.

**Package exports convention** (in each module's `package.json`):
```json
{ ".": "main", "./meta": "meta.ts", "./router": "Router.tsx", "./provider": "Provider.tsx", "./registrant": "Registrant.tsx" }
```

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

### Frontend Module Details

#### Core Frontend (`modules/core/frontend/`)

Provides authentication, generic entity CRUD, administration, and the extension registration system all other modules build on.

**Directory layout** (`lib/`):
```
features/
  session/          — Login, logout, 2FA, AuthGuard/NoAuthGuard, useSession() hook
  entities/         — Generic entity list/detail/selector (EntityTable, EntityDetails, EntitySelector)
  importer/         — Load set pipeline (LoadSetCreator → LoadSetEditor → LoadSetViewer)
  administration/   — Admin panel with pluggable tabs (users, roles, origins, locations, units)
  vocabularies/     — Vocabulary management
  publication-status/ — Publication status query helpers
  user-account-*/   — Activation, recovery, settings
components/
  Header/           — App header with nav
  Editor/           — Monaco code editor integration
Toolbar/            — Dynamic per-page toolbar system (ToolbarProvider + useToolbar hook)
utils/              — Table column generation, date formatting, filters, safe_name
```

**Routes** (all behind AuthGuard unless noted):
```
/authenticate         — Login (NoAuthGuard)
/authenticate/:user   — Two-factor (NoAuthGuard)
/password_reset       — Password reset (NoAuthGuard)
/activate/:token      — Account activation (NoAuthGuard)
/entities             — Entity list
/entities/:entity     — Entity type list
/entities/:entity/:id — Entity detail/edit ("new" for create)
/vocabularies/*       — Vocabulary management
/administration/*     — Admin panel (Administrator role)
/account              — User profile settings
/load_sets/:id        — Import load set viewer
```

**Session management**: `useSession()` polls `/api/grit_core/user_session` (30s stale, 5s retry). Returns `Session` with `{ id, login, name, email, roles[], settings, token, server_settings }`. `useHasRoles(roles)` for permission checks.

**Extension registries** (React Context-based, modules register via hooks in their Registrant):
- `EntityFormsContext` — `useRegisterEntityForm(entityType, Component)` for custom entity forms
- `ImportersContext` — `useRegisterImporter(entity, importerComponents)` for custom importers
- `AdministrationTabsContext` — `useRegisterAdministrationTabs(tabs)` for admin panel tabs
- `FormInputProvider` (from `@grit42/form`) — `useRegisterFormInput(type, Component)` for form input types
- `ColumnTypeDefProvider` (from `@grit42/table`) — `useRegisterColumnTypeDef(type, def)` for table column types

**Key entity hooks** (from `features/entities/queries.ts`):
- `useEntity(entity)` — metadata (columns, fields, path)
- `useEntityColumns(entity)` / `useEntityFields(entity)` — column/field definitions
- `useEntityData(path, sort, filters)` — all data (limit: -1)
- `useInfiniteEntityData(path, sort, filters)` — paginated (500/page, infinite scroll)
- `useEntityDatum(path, id)` — single record (`{}` when id === "new" for create mode)

**Key entity mutations** (from `features/entities/mutations.ts`):
- `useCreateEntityMutation(path)` — POST `/{path}`
- `useEditEntityMutation(path, id)` — PATCH `/{path}/{id}`
- `useDestroyEntityMutation(path)` — DELETE `/{path}/destroy?ids={id}`

**Toolbar system**: Per-page components register actions via `useToolbar()` hook. Categories: `exportItems[]`, `importItems[]`, `actions[]`, `documentationItems[]`. Auto-cleanup on unmount.

#### Compounds Frontend (`modules/compounds/frontend/`)

Chemical compound management with structure rendering/editing via OpenChemlib.

**Directory layout** (`lib/`):
```
components/
  MoleculeViewer/      — AsyncMoleculeViewer (molfile → SVG), copy SMILES/molfile menu
  MoleculeEditor/      — Interactive StructureEditor (react-ocl/full), molfile + SMILES inputs
  MoleculeInput/       — Form field for molecules, opens full-screen editor dialog
  CompoundTypesSelector/ — ButtonGroup multi-select for compound type filtering
extensions/
  entity-form/compound/ — CompoundDetails form (molecule validation, dedup check, read-only after create)
  entity-form/batch/    — BatchDetails form
  form/MolInput.tsx     — Registers "mol" form input type
  table/MolCell.tsx     — Registers "mol" column cell (300×300 molecule SVG)
  table/MolFilterInput.tsx — Substructure/exact match filter (SMARTS/SMILES)
  importer/             — SDF/CSV auto-detection (guessCompoundDataSetValues)
pages/compounds/
  index.tsx             — Compounds list (infinite scroll, type filter, toolbar)
  [id]/details/         — Compound properties + structure viewer
  [id]/batches/         — Batches sub-table
  [id]/synonyms/        — Synonyms sub-table
  settings/             — Compound types/properties admin, load set history
queries/                — useInfiniteCompounds, useCompound, useCompoundFields, useCompoundGridMeta
                          useBatchFields, useInfiniteBatchesOfCompound, useInfiniteSynonymsOfCompound
mutations/              — useDestroyBatch, useDestroySynonym (wrapping core destroy mutations)
```

**Routes**:
```
/compounds              — Compounds list (filterable by type)
/compounds/:id          — Tab container (details, batches, synonyms)
/compounds/settings/*   — Admin: compound types, properties, load sets
```

**Registrant** registers: compound/batch entity forms, "mol" input type, "mol" column type, compound importer.

**Molecule deduplication**: On create, async-validates via `POST /api/grit/compounds/molecules/molecule_exists`. If structure exists, warns user and shows linked compounds. Molecule field becomes **read-only** after compound creation.

#### Assays Frontend (`modules/assays/frontend/`)

Experiment management with dynamic data sheets, plots, and publication workflow.

**Directory layout** (`lib/`):
```
pages/
  experiments/
    ExperimentsPage.tsx       — Experiments list table
    experiment/
      details/                — ExperimentForm + ExperimentMetadataForm + ExperimentActions
      data-sheet/             — Dynamic record table + RecordForm (fields from data sheet definition)
      plots/                  — ExperimentPlot (Plot + PlotSettings, scatter/box)
      load-sets/              — Import history per experiment
      ExperimentTabs.tsx      — Dynamic tabs: Details, [data sheet names...], Plots, Load sets
  assays/settings/
    assay-models/             — Assay model admin (details, data sheets, metadata, data-sheet-loader)
  assay-models/               — Assay models listing (user view)
features/
  data-tables/                — Published experiment data aggregation
    data-table/data/          — Infinite-scroll data table with filter/sort
    data-table/plots/         — DataTablePlot (interactive plot builder)
    data-table/entities/      — Entity selector for data table columns
    data-table/columns/       — Column management (assay vs entity attribute)
  assay-metadata-definitions/ — Vocabulary-backed metadata definitions
queries/                      — experiments, experiment_data_sheet, experiment_data_sheet_records,
                                assay_models, assay_data_sheet_definitions, assay_data_sheet_columns,
                                assay_metadata_definitions, assay_types, experiment_metadata_templates
mutations/                    — assay_models (publish, draft, CRUD)
extensions/importer/          — Registers experiment data sheet record importer
```

**Routes**:
```
/assays/experiments                           — Experiments list
/assays/experiments/:id/details               — Experiment form + metadata + publish actions
/assays/experiments/:id/sheets/:sheet_id      — Data sheet records table + form
/assays/experiments/:id/plots/:plot_id        — Interactive plot builder
/assays/experiments/:id/load-sets             — Import history
/assays/assay-models/*                        — Assay models listing
/assays/assay-models/settings/*               — Admin: models, types, metadata definitions
/assays/data_tables                           — Published data tables list
/assays/data_tables/:id/{data,plots,entities,columns} — Data table views
```

**Publication workflow UI**: `ExperimentActions` component — Draft state shows "Publish" button (`usePublishExperimentMutation`), Published state shows "Convert to Draft" button (`useDraftExperimentMutation`). Published experiments have read-only forms.

**Dynamic data sheets**: Forms and tables are generated from `useExperimentDataSheetRecordFields()` and `useExperimentDataSheetRecordColumns()`, driven by `assay_data_sheet_definition_id`. This matches the backend's runtime `ds_{id}` tables.

**Plot builder**: Two-column layout — `<Plot>` visualization (plotly.js) + `<PlotSettings>` config panel. Supports scatter and box plots with axis selection, group-by, and dirty state tracking (save/revert/delete). Plot definitions stored in experiment/data_table records.

### Shared Frontend Packages (`packages/frontend/`)

#### @grit42/api — HTTP Client & Query Infrastructure
- Re-exports all of `@tanstack/react-query`
- `axiosClient` — Axios instance (baseURL: `/api`, withCredentials, JSON headers)
- `queryClient` — QueryClient (10s staleTime, no retries, no auto-refetch)
- `request(url, params)` — Generic GET request wrapper
- `getURLParams()`, `getSortParams()`, `getFilterParams()` — Serialize query/sort/filter for API
- `notifyOnError()` — Mutation error handler that shows toast notifications

#### @grit42/client-library — Design System & UI Components
- **Components**: `Button`, `ButtonGroup`, `Input` (text/date/numeric/URL), `Select` (single/multi/combobox, via @floating-ui/react), `Checkbox`, `ToggleSwitch`, `FileInput` (react-dropzone), `Surface`, `Dialog`, `Popover`, `Menu`, `Dropdown`, `Tabs` (react-tabs), `Spinner`, `ErrorPage`, `CopyableBlock`, `Portal`, `InputLabel`, `InputError`, `Tooltip`
- **Theme system**: `ThemeProvider` → `useTheme()`, `usePalette()`, `useDisplayDensity()`. `createTheme(colorScheme, displayDensity)` with dark/light palettes and comfortable/compact density
- **Icons**: 150+ SVG icon components (animals, lab equipment, molecules, UI actions, comparison operators, storage, holiday-themed logos)
- **Hooks**: `useLocalStorage()`, `useLocalStorageChanges()`
- **Utils**: `classnames()`, `downloadFile()`, `generateUniqueID()`
- **SCSS exports**: `theme.scss`, `mixins.scss` for CSS module variables

#### @grit42/form — Form Framework
- Wraps `@tanstack/react-form` with definition-driven rendering
- `Form` — wrapper component, `FormField` — single field renderer from `FormFieldDef`, `FormControls` — action buttons
- **FormInputProvider** — Registry pattern for custom input types. Built-in: `DefaultInput` (string), `SelectInput`, `BinaryInput` (file), `BooleanInput` (toggle). Modules register custom types (e.g., "mol", "entity") via `useRegisterFormInput(type, Component)`
- `FormFieldDef` — `{ name, display_name, type, required?, hidden?, disabled?, reference?, limit? }`. `SelectFormFieldDef` adds `select.options[]`. `BinaryFormFieldDef` adds Dropzone props
- **Utils**: `getVisibleFieldData(fields, values)` — strips hidden fields before submit. `requiredValidator(field, value)`. `genericErrorHandler(error)` — maps API validation errors to form fields

#### @grit42/table — Data Grid
- Wraps `@tanstack/react-table` + `@tanstack/react-virtual` for virtualized scrolling
- `Table<T>` — main component. Simple mode: pass `columns`/`data`. Advanced mode: pass `tableState` from `useSetupTableState(id, columns, settings)`
- **Features**: sorting, column filtering (operators: eq/ne/contains/regexp/in_list/empty/not_empty/gt/gte/lt/lte), column visibility toggle, column reorder (drag-and-drop via @dnd-kit), column resizing, row selection (single/multi/select-all), infinite scroll pagination, row actions (delete/clone), expandable rows, column description tooltips
- **Column type system**: `ColumnTypeDefProvider` + `useRegisterColumnTypeDef(type, def)` for custom cell renderers and filter inputs. Modules register custom types (e.g., "mol" with molecule SVG cell, "entity" with FK selector filter)
- State persisted to localStorage by table ID

#### @grit42/notifications — Toast System
- Wraps `react-toastify`. `ToastContainer` (top-right, 5s auto-close, dark theme)
- `toast()`, `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`
- `upsert(content, options)` — update existing toast by ID or create new

#### @grit42/plots — Data Visualization
- Wraps `plotly.js` / `react-plotly.js` with theme-aware styling
- `Plot<T>` — renders ScatterPlot or BoxPlot based on `PlotDefinition.type`
- `PlotSettings` — config panel for axis selection, group-by, plot type
- `PlotDefinition` = `{ title, type: "scatter"|"box", x?, y, groupBy? }` with `AxisType` per axis
- Data format: `SourceData = Record<string, Datum>[]`, `SourceDataProperties = { name, display_name }[]`

#### @grit42/spreadsheet — Excel/CSV File Parsing
- Wraps `xlsx` library for file parsing
- `sheetDefinitionsFromFile(file)` — parse Excel/CSV/ODS files, returns `Sheet[]` with metadata
- `columnDefinitionsFromSheet(sheet, options)` — extract column definitions with auto-detected data types (`integer`, `decimal`, `string`, `text`, `boolean`, `date`, `datetime`)
- `sampleSheetData(sheet, rows)` — preview first N rows
- Configuration: `{ nameRowIndex, columnOffset, dataRowOffset, identifierRowIndex?, descriptionRowIndex? }`

### Dependency Hierarchy

```
@grit42/grit (app shell)
├── @grit42/core → @grit42/{api, client-library, form, table, notifications} + monaco-editor + dayjs
├── @grit42/compounds → @grit42/{core, api, client-library, form, table, notifications} + openchemlib + react-ocl + usehooks-ts + zod
└── @grit42/assays → @grit42/{core, api, client-library, form, table, notifications, plots, spreadsheet} + openchemlib + react-ocl + zod

@grit42/api → @tanstack/react-query + axios + @grit42/notifications
@grit42/form → @tanstack/react-form + @grit42/client-library
@grit42/table → @tanstack/react-table + @tanstack/react-virtual + @dnd-kit/* + @grit42/client-library
@grit42/plots → plotly.js + react-plotly.js + @grit42/client-library
@grit42/spreadsheet → xlsx (no @grit42 dependencies)
@grit42/notifications → react-toastify
@grit42/client-library → @floating-ui/react + dayjs + react-dropzone + react-tabs + react-helmet-async
```

### Frontend Patterns & Conventions

**Feature organization** — each feature follows:
```
features/{name}/
  index.ts           — public API exports
  queries.ts         — React Query read hooks (useQuery/useInfiniteQuery)
  mutations.ts       — React Query write hooks (useMutation)
  types.ts           — TypeScript interfaces
  pages/             — route components
  components/        — feature-specific components
```

**Entity CRUD pattern** (used throughout):
1. **List**: `useInfiniteEntityData()` → `Table` with infinite scroll, toolbar with New/Import/Export
2. **Detail**: `useEntityDatum(path, id)` + `useEntityFields()` → `Form` + `FormField` per field. Submit via `useCreateEntityMutation` (POST) or `useEditEntityMutation` (PATCH). ID `"new"` = create mode
3. **Delete**: `useDestroyEntityMutation(path)` → DELETE `/{path}/destroy?ids={id}`

**Form extension pattern**: Modules register custom form components for specific entity types via `useRegisterEntityForm(entityType, Component)`. The generic `EntityDetails` renders the default form; entity-specific forms override it.

**Table extension pattern**: Modules register custom column types via `useRegisterColumnTypeDef(type, { cell, filterInput })`. This adds custom rendering (e.g., molecule SVG) and filtering (e.g., substructure search) for specific column types.

**Importer extension pattern**: Modules register entity-specific importers via `useRegisterImporter(entity, { creator, editor, viewer })`. The core load set pipeline delegates to these for entity-specific upload/mapping/validation.

**Vite library builds**: Each package/module uses Vite with `vite-plugin-dts` (generates .d.ts), `vite-plugin-lib-inject-css` (CSS injection), and `vite-plugin-externalize-deps` (peer deps as externals).

### Build Tooling

- **Nx 21** orchestrates builds with caching and dependency-aware task execution
- **pnpm 10** workspaces for frontend package management (versions via `catalog:` in `pnpm-workspace.yaml`)
- **Vite 5** for frontend builds (app uses `@vitejs/plugin-react`, libraries use lib mode)
- **Custom Nx Ruby plugin** in `tools/ruby/` integrates Rails engine gems into the Nx graph

## Code Style

- **TypeScript/JS**: ESLint 9 (flat config) + Prettier (80 char width, double quotes, trailing commas, semicolons). `@typescript-eslint/no-explicit-any` = "warn". React Hooks + React Refresh plugins
- **Ruby**: RuboCop with Rails Omakase style
- **SCSS** for styling with CSS modules (`*.module.scss`), camelCase convention for class name access

## Key Technologies

- **React 18** with React Router 6 and TanStack React Query 5
- **TanStack React Form** for form state management
- **TanStack React Table** + **React Virtual** for virtualized data grids
- **Rails 7.2** with PostgreSQL 16 + RDKit extension
- **Authlogic** for authentication
- **OpenChemlib / react-ocl** for chemical structure rendering and editing
- **Plotly.js / react-plotly.js** for data visualization (scatter, box plots)
- **xlsx** for Excel/CSV file parsing in the browser
- **Monaco Editor** for code editing in admin forms
- **@floating-ui/react** for popovers, dropdowns, and tooltips
- **@dnd-kit** for drag-and-drop column reordering
- **Zod** for validation schemas (in compounds/assays modules)
- **Docusaurus 3** for documentation (`grit-docs/`)
