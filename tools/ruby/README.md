# @tools/ruby

Nx plugin for Ruby/Rails projects in the monorepo. Automatically infers targets for Rails applications and Ruby gems.

## Features

- **Auto-detection**: Detects Ruby projects via `Gemfile` or `*.gemspec` files
- **Dependency graph**: Parses gem dependencies and maps them to Nx project graph
- **Versioning**: Custom `VersionActions` for `nx release` (reads/writes `version.rb`)
- **Lint integration**: Auto-detects Rubocop when `.rubocop.yml` is present

## Inferred Targets

### Development

| Target       | Command                           | Description                     |
| ------------ | --------------------------------- | ------------------------------- |
| `dev`        | `bin/rails server`                | Start Rails development server  |
| `serve`      | `bin/rails server`                | Alias for `dev`                 |
| `dev:test`   | `RAILS_ENV=test bin/rails server` | Start server with test database |
| `serve:test` | `RAILS_ENV=test bin/rails server` | Alias for `dev:test`            |

### Testing

| Target | Command          | Description                 |
| ------ | ---------------- | --------------------------- |
| `test` | `bin/rails test` | Run Minitest tests (cached) |

### Linting (when `.rubocop.yml` exists)

| Target     | Command                  | Description                 |
| ---------- | ------------------------ | --------------------------- |
| `lint`     | `bundle exec rubocop`    | Run Rubocop linter (cached) |
| `lint:fix` | `bundle exec rubocop -A` | Auto-fix Rubocop violations |

### Database Management

| Target            | Command                               | Description                 |
| ----------------- | ------------------------------------- | --------------------------- |
| `db:migrate`      | `bin/rails db:migrate`                | Run pending migrations      |
| `db:reset`        | `bin/rails db:reset`                  | Drop, create, migrate, seed |
| `db:seed`         | `bin/rails db:seed`                   | Load seed data              |
| `db:setup`        | `bin/rails db:setup`                  | Create, migrate, seed       |
| `db:migrate:test` | `RAILS_ENV=test bin/rails db:migrate` | Migrate test database       |
| `db:reset:test`   | `RAILS_ENV=test bin/rails db:reset`   | Reset test database         |

### Utilities

| Target   | Command          | Description                          |
| -------- | ---------------- | ------------------------------------ |
| `rails`  | `bin/rails`      | Passthrough to run any rails command |
| `bundle` | `bundle install` | Install gem dependencies             |

### Build (gems only)

| Target      | Command               | Description                  |
| ----------- | --------------------- | ---------------------------- |
| `gem:build` | `gem build *.gemspec` | Build the .gem file (cached) |

## Usage Examples

```bash
# Start development server
nx run grit-grit:dev

# Run tests
nx run grit-core:test

# Run any rails command via passthrough
nx run grit-core:rails -- db:version
nx run grit-core:rails -- generate model User name:string
nx run grit-grit:rails -- routes

# Lint Ruby code
nx run grit-core:lint
nx run grit-core:lint:fix

# Database operations
nx run grit-grit:db:migrate
nx run grit-grit:db:reset:test

# Build a gem
nx run grit-core:gem:build
```

## Plugin Options

Configure the plugin in `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "./tools/ruby/src/index.ts",
      "options": {
        "testTargetName": "test",
        "lintTargetName": "lint",
        "devTargetName": "dev",
        "railsTargetName": "rails",
        "createDbTargets": true
      }
    }
  ]
}
```

| Option            | Default   | Description                           |
| ----------------- | --------- | ------------------------------------- |
| `testTargetName`  | `"test"`  | Name for the test target              |
| `lintTargetName`  | `"lint"`  | Name for the lint target              |
| `devTargetName`   | `"dev"`   | Name for the dev server target        |
| `railsTargetName` | `"rails"` | Name for the rails passthrough target |
| `createDbTargets` | `true`    | Whether to create database targets    |

## Project Detection

The plugin detects Ruby projects when:

1. A `Gemfile` or `*.gemspec` file exists in the directory
2. A `project.json` file exists (to avoid creating projects for vendored gems)

Projects with a `.gemspec` file are treated as **libraries**, others as **applications**.

## Named Inputs

The plugin uses these named inputs defined in `nx.json`:

- `rubySource`: `app/`, `lib/`, `config/`, `db/` directories
- `rubyTest`: `test/`, `spec/` directories
- `rubyLintable`: All `*.rb` files and `.rubocop.yml`

## Dependency Graph

The plugin automatically detects dependencies between Ruby projects by:

1. Parsing `*.gemspec` files for runtime dependencies
2. Parsing `Gemfile` for gem references
3. Mapping gem names to Nx project names

This enables proper build ordering with `dependsOn: ["^build"]`.

## Limitations

### Interactive Commands

Interactive commands like `rails console` and `rails dbconsole` require direct TTY access that Nx's pseudo-terminal doesn't fully support. For these commands, run them directly in the project directory:

```bash
# Rails console
(cd modules/core/backend && bin/rails console)

# Or use a subshell
pushd modules/core/backend && bin/rails console; popd
```

Non-interactive rails commands work fine through the `rails` target:

```bash
nx run grit-core:rails -- db:version
nx run grit-core:rails -- routes
```
