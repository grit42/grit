# Grit Codebase Improvements

## Critical Bugs

- [x] Fix missing `return` in `App.tsx` loading spinner branch — JSX is evaluated but never returned
- [x] Fix `GritEntityController#show` — "not found" branch silently does nothing due to redundant `unless @record.nil?` guard
- [x] Fix `production.rb` — `config.force_ssl = false` at line ~100 overrides `config.force_ssl = true` set earlier

## High Priority (Security / Reliability)

- [ ] Set up CI pipeline (automated tests, linting, security scanning, Docker builds)
- [X] Replace bare `rescue` in `GritEntityRecord` with `rescue StandardError => e` and log a warning
- [X] Configure CORS for production origins (currently hardcodes `localhost:3001`)
    - this is okay because the frontend is served by the rails backend?
- [X] Remove hardcoded `SECRET_KEY_BASE=secretkeybase` from `docker-compose.yml`
    - removed unused docker compose entirely

## Medium Priority (Tech Debt)

- [ ] Upgrade `pnpm` from `10.0.0-alpha.4` to a stable release
- [ ] Enable TypeScript strict mode across all tsconfigs
- [ ] Stop re-exporting all of React Query from `@grit42/api` — export only what's used
- [ ] Address `xlsx` being loaded from CDN instead of npm (bypasses `pnpm audit`)
- [ ] Extract role name strings into constants (e.g. `"Administrator"`, `"CompoundAdministrator"`)
- [x] Remove duplicate `molecule_id = molecule_record.id` line in `Compound.create`
- [ ] Fix Prettier version mismatch — root `package.json` has v2, pnpm catalog has v3

## Ruby/Rails Nx Integration

- [ ] Add CI/CD GitHub Actions workflows for test, lint, and release
- [ ] Add lint/format targets (RuboCop) for Ruby projects in the Nx plugin
- [ ] Improve inter-gem dependency version bumping in `RubyVersionActions`
- [ ] Add separate cached `build` target for `.gem` artifacts
- [ ] Add `db:prepare` Nx target on the host app with engine dependencies
- [ ] Enable caching for Ruby lint and format targets
- [ ] Add typecheck-equivalent for Ruby (Sorbet/RBS)
- [ ] Improve dev experience with `nx watch` for engine gem changes
- [ ] Add integration/system test target on `grit-grit` across all engines

## Improvements

- [ ] Add frontend unit tests for `@grit42/form`, `@grit42/table`, `@grit42/notifications`, `@grit42/plots`, `@grit42/api`, `@grit42/client-library`
- [ ] Add pre-commit hooks (Husky or lefthook) for lint/format enforcement
- [ ] Add API documentation (OpenAPI/Swagger spec)
- [ ] Populate Storybook with stories for `@grit42/client-library` components
- [ ] Make Nx Ruby plugin `createDependencies` async instead of synchronous `execSync` in a loop
- [ ] Remove unused ActiveStorage (required in `application.rb` + migration, but never used)
- [ ] Add `.nvmrc` or `.node-version` file for Node version pinning
- [ ] Fix `moduleResolution` in root `tsconfig.base.json` — should be `"bundler"` or `"node16"` instead of `"node"`
- [ ] Commit Playwright auth setup file and uncomment `webServer` config
- [ ] Move `modules/assays/INIT.md` to `docs/` or `grit-docs/`
