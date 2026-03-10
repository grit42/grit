# CI Pipeline Setup Guide

**act + GitHub Actions — Local & Remote CI**

> **Key idea:** Use `act` locally to catch failures before pushing. GitHub Actions is the source of truth for the team.

---

## 1. Running CI Locally with act

`act` runs your GitHub Actions workflows locally using Docker. It reads the same `.github/workflows/` files, so there is no duplication between local and remote CI.

### Installation

```bash
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Windows (Chocolatey)
choco install act-cli
```

### Basic Usage

```bash
# Run the full pipeline
act

# Run a specific job
act -j ci

# Dry run — see what would execute
act -n

# Pass secrets from a file
act --secret-file .secrets
```

### Team Configuration (`.actrc`)

Add a `.actrc` file at the repo root so everyone uses consistent settings automatically:

```
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--container-architecture linux/amd64
```

> **Secrets:** Create a local `.secrets` file (gitignored) for API keys and tokens. Never commit this file.

---

## 2. GitHub Actions Workflow

Create `.github/workflows/ci.yml`. This workflow runs lint, tests, and build. The same file is used by `act` locally and GitHub Actions remotely.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    paths:
      - "src/**"
      - "tests/**"
      - "package*.json"
      - ".github/workflows/**"

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Test
        run: npm test

  build:
    runs-on: ubuntu-latest
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
```

---

## 3. Cost Optimization

The workflow above already includes the most impactful cost-saving techniques:

- **Concurrency cancellation** — cancels in-progress runs when new commits are pushed to the same branch
- **Path filters** — skips CI entirely when only unrelated files change (e.g. README updates)
- **Dependency caching** — `cache: npm` avoids reinstalling packages on every run
- **Build only on main** — the expensive build job only runs after merging, not on every PR

> Combining cancellation + path filters typically reduces Actions usage by **40–60%** for an active team.

---

## 4. Branch Protection

To require CI to pass before merging a PR, go to **Settings → Branches → Add rule** and configure:

- **Branch name pattern:** `main`
- **Require status checks to pass before merging:** enabled
- **Required status check name:** `lint-and-test` (must match the job name in the workflow)
- **Require branches to be up to date:** recommended

> GitHub matches status checks by job name. If you rename the job in the workflow, update the branch protection rule to match.

---

## 5. Optional: Self-Hosted Runner

If GitHub Actions costs are a concern, a self-hosted runner eliminates per-minute charges entirely. A basic VPS ($5–10/month) handles light CI for a small team easily.

Go to **Settings → Actions → Runners → New self-hosted runner** and follow the generated instructions. Then update your workflow:

```yaml
# Change runs-on in your workflow to:
runs-on: self-hosted
```

---

## 6. Recommended Developer Workflow

1. Write code and make changes locally
2. Run `act` to verify the pipeline passes before pushing
3. Push your branch and open a PR
4. GitHub Actions runs automatically and posts the result to the PR
5. Branch protection blocks merge until `lint-and-test` passes

---

## Quick Reference

| Command                      | Purpose                           |
| ---------------------------- | --------------------------------- |
| `act`                        | Run full pipeline locally         |
| `act -j ci`                  | Run a specific job                |
| `act -n`                     | Dry run (preview only)            |
| `act --secret-file .secrets` | Pass local secrets                |
| `gh workflow run ci.yml`     | Trigger workflow manually via CLI |
