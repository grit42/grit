# SQL Injection Audit

Follow-up to commit `5a49425e` ("fix: data table entity sql injection"), which
coerced `params[:data_table_id]` to an integer before interpolating it into raw
SQL fragments.

## Background

The codebase builds many SQL fragments with Ruby string interpolation
(`.joins("... #{x}")`, `.select(...)`, `.order(...)`, `.where(...)`, raw
`execute(...)`). Two classes of interpolated value exist:

- **Trusted schema identifiers** — `table_name`, and `safe_name` (validated by
  `/\A[a-z0-9_]*\z/`, see `assay_metadata_definition.rb:32-34`). These are safe
  and are **not** flagged below.
- **Request-derived values** — `params[...]` or JSON-decoded request bodies
  (`params[:sort]`, `params[:filter]`). These are the injection vectors.

> ⚠️ Key gotcha: `ActiveRecord::Base.sanitize_sql_array(["...string..."])` with a
> **single string and no `?` placeholder does not escape anything** — it returns
> the string verbatim. Several call sites below wrap raw interpolation in
> `sanitize_sql_array` and gain no protection from it.

> ⚠️ Framework mitigation — the sink method matters. ActiveRecord runs
> `disallow_raw_sql!` on the arguments to only a few methods: **`order`,
> `reorder`, `pluck`, `in_order_of`, and `insert_all`/`upsert_all`**. There, a
> plain `String` is only accepted if it matches a bare `column [ASC|DESC]`
> matcher, otherwise it raises `ActiveRecord::UnknownAttributeReference` (unless
> wrapped in `Arel.sql`). Verified against the call sites of `disallow_raw_sql!`
> in activerecord 8.1.3 (`query_methods.rb`, `calculations.rb`, `insert_all.rb`).
>
> All the other string-accepting query methods — **`where`, `joins`, `from`,
> `select`, `group`, `having`, `find_by_sql`, `execute`** — do **not** enforce
> the whitelist and execute raw strings as-is. (That is why this codebase's
> `.select("to_jsonb(...) as datum")` works.) So: interpolation reaching
> **`.order/.reorder/.pluck`** is *blocked by Rails*; interpolation reaching any
> of the others is exploitable. Use this as the litmus test when triaging the
> findings below.

---

## 1. Sort `direction` in the shared data-grid path — LOW (mitigated by Rails `disallow_raw_sql!`)

> **Re-classified after live testing.** Originally rated HIGH. The sort fields
> reach the database through **`.order(...)`**, which Rails guards with
> `disallow_raw_sql!` — see the framework note in Background. An injected
> `direction` does not match the `column [ASC|DESC]` matcher and is rejected with
> `ActiveRecord::UnknownAttributeReference` before any SQL runs. So this is **not
> exploitable** on Rails 8.1; it is a defense-in-depth / robustness item only.

**File:** `modules/core/backend/app/controllers/concerns/grit/core/controller/readable.rb:58`
(and the same pattern at `:34`)

```ruby
# params[:sort] is JSON-decoded user input (line 77)
scope = scope.order(
  ActiveRecord::Base.send(:sanitize_sql_array,
    [ "#{select_values_map[sort_item["property"]]} #{sort_item["direction"]} NULLS LAST" ])
)
```

`property` is safe here — it is a key into `select_values_map`, a whitelist of
the scope's own select columns. `direction` is interpolated raw, but `.order`'s
`disallow_raw_sql!` rejects anything that isn't a bare column/direction token.

### Verification

```
GET /api/grit/core/countries?sort=[{"property":"id","direction":"ASC, (SELECT 1)"}]
```
Returns HTTP 500 `ActiveRecord::UnknownAttributeReference: Dangerous query
method ... non-attribute argument(s)` — Rails blocks it; the payload never
reaches Postgres.

### How it could be fixed (defense-in-depth)

Whitelist the direction to a fixed set before interpolation (also makes the
rejected request a clean response instead of a 500):

```ruby
dir = sort_item["direction"].to_s.strip.casecmp("desc").zero? ? "DESC" : "ASC"
```

Apply at both `:58` and `:34`. **(Done — see `sort_direction` helper.)**

---

## 2. Raw-SQL grid path — filter `property` via `.where` — HIGH (confirmed exploitable)

**File:** `modules/core/backend/app/controllers/concerns/grit/core/controller/readable.rb:34,38`

`filter_and_sort_raw_sql` runs when a scope returns a `String` (line 69):

```ruby
# line 34 — sort, reaches the DB via .order  → guarded by disallow_raw_sql! (see #1)
scope = scope.order(ActiveRecord::Base.send(:sanitize_sql_array,
  [ "sub.#{sort_item["property"]} #{sort_item["direction"]}" ]))

# line 38 — filter, reaches the DB via .where → NOT guarded → exploitable
scope = scope.where(Grit::Core::FilterProvider.execute(
  filter_item["type"], filter_item["operator"],
  "sub.#{filter_item["property"]}", filter_item["value"]))
```

Both interpolate raw user input, but the **sink method** decides exploitability
(see the framework note in Background):

- **Line 34 (sort → `.order`)** — blocked by `disallow_raw_sql!`, same as #1.
  Not exploitable; the quoting added there is defense-in-depth.
- **Line 38 (filter → `.where`)** — **the real vulnerability.** The `property`
  flows into the `FilterProvider` lambdas in
  `modules/core/backend/lib/grit/core.rb:29-71`, which build e.g.
  `"#{property} ILIKE ?"` (line 46) or `"#{property} IS NULL"` (line 35). The
  *value* is parameterized with `?`, but the *property* is interpolated raw, and
  `.where(String)` executes it as raw SQL with no guard.

### Reachability — confirmed

A string-returning scope exists and is reachable:
`Grit::Assays::DataTableColumn.available_entity_attributes`
(`modules/assays/backend/app/models/grit/assays/data_table_column.rb:70-75`)
returns a raw `SELECT ... ` string and is selectable via the generic `?scope=`
parameter. Its subquery exposes the columns `name` and `safe_name`.

### How it can be exploited (filter path)

Use a `data_table_id` that exists. The payload smuggles a subquery through the
filter **property**; `$$…$$` dollar-quoting avoids shell-quote issues and
`grit_sqli_probe` is the marker:

```bash
curl -s -G "http://localhost:3000/api/grit/assays/data_table_columns" \
  -H "Authorization: Bearer <token>" \
  --data-urlencode 'scope=available_entity_attributes' \
  --data-urlencode 'data_table_id=1' \
  --data-urlencode 'filter=[{"type":"integer","operator":"empty","property":"name IS NULL OR (SELECT CAST($$grit_sqli_probe$$ AS int)) IS NULL","value":""}]'
```

- **Vulnerable** → builds `WHERE (sub.name IS NULL OR (SELECT
  CAST($$grit_sqli_probe$$ AS int)) IS NULL)`; the CAST runs and the response
  leaks `invalid input syntax for type integer: "grit_sqli_probe"` — injected
  SQL executed.
- **Fixed** → property becomes a single quoted identifier
  `sub."name IS NULL OR ..."`; Postgres returns `column ... does not exist` and
  the subquery is never evaluated.

### How it could be fixed

Quote the property with `connection.quote_column_name` (a simple column ref
becomes a quoted identifier; an injection payload collapses to one invalid
identifier), or validate it against the known column/alias set as the AR path
does via `select_values_map`. Apply at line 38 (filter) and — for
defense-in-depth — line 34 (sort).

**(Done — `quote_sort_property` helper now wraps the property at both `:34` and
`:38`.)**

---

## 3. `load_set_block` preview/error/warning scopes — HIGH

**File:** `modules/core/backend/app/models/grit/core/load_set_block.rb:70, 75-83, 88-96`

```ruby
def self.preview_data(params = nil)
  raise "No load set block id provided" if params.nil? or params[:id].nil?
  self.unscoped.from("raw_lsb_#{params[:id]}").select("raw_lsb_#{params[:id]}.*")  # :70
end

def self.errored_data(params = nil)
  ...
  load_set_block_id = params[:id]                       # no coercion :75
  self.unscoped.from("lsb_#{load_set_block_id}")        # :76
    .select("lsb_#{load_set_block_id}.line", ...)       # :78-80
    .joins("JOIN raw_lsb_#{load_set_block_id} ON ...")  # :82
    .where("lsb_#{load_set_block_id}.record_errors IS NOT NULL")  # :83
end
# warning_data (:88-96) is identical
```

`params[:id]` is interpolated unchecked into table names across `from`, `select`,
`joins`, and `where` — all **unguarded** sinks (see Background). The value lands
in a SQL **identifier** position (`raw_lsb_<id>` / `lsb_<id>`).

### Reachability — confirmed

These scopes are reached via `GET /api/grit/core/load_set_blocks/:id/preview_data`
(the action sets `params[:scope]` and calls `index`,
`load_set_blocks_controller.rb:91-104`) and via the generic index with
`?scope=preview_data&id=...`.

**Gate:** this controller overrides `check_read`
(`load_set_blocks_controller.rb:245-256`) to run
`LoadSetBlock.find(params[:id])` and rescue `RecordNotFound` → `"Not found"`.
`find`'s integer cast is lenient (`"5x".to_i == 5`, `"grit".to_i == 0`), so a
plain-text marker is cast to `0`, finds no record, and is blocked. **But** the
`find` only runs when `params[:entity]` is blank (line 248): passing
`?entity=<an entity the caller can read>` skips the gate entirely. (Alternatively
prefix the payload with a real block id, e.g. `id=7zzzGRITPROBE`.)

### How it can be exploited

`id` is concatenated raw into the table identifier; the marker reflects in the
SQL error (error detail leaks via finding D). `Grit::Core::Country` needs
`read:system`:

```bash
curl -s -G "http://localhost:3000/api/grit/core/load_set_blocks/grit_sqli_probe/preview_data" \
  -H "Authorization: Bearer <token>" \
  --data-urlencode 'entity=Grit::Core::Country'
```

- **Vulnerable** → `PG::UndefinedTable: ERROR: relation
  "raw_lsb_grit_sqli_probe" does not exist` — the string was interpolated
  verbatim into the `FROM` identifier (unhandled in `index` → verbose 500).
- **Fixed** → `relation "raw_lsb_0" does not exist` — `.to_i` collapsed the
  payload to `0`; the marker is gone.

An attacker who knows a valid `raw_lsb_<n>` table can go further and break out of
the `FROM`/`JOIN`/`WHERE` to pivot to other relations.

### How it could be fixed — **Done**

Coerce once at the top of each method and use the integer everywhere (mirrors the
`data_table_entity` fix). Applied to `preview_data` (`:70`), `errored_data`
(`:76`), and `warning_data` (`:89`):

```ruby
load_set_block_id = params[:id].to_i
```

(`flattened_errors`/`raw_data_table_name`/`loading_records_table_name` use the
model's own `self.id` and were already safe.)

---

## 4. `assay_metadata_definition.by_assay_model` — HIGH

**File:** `modules/assays/backend/app/models/grit/assays/assay_metadata_definition.rb:48`

```ruby
def self.by_assay_model(params)
  raise "No assay model provided" if params["assay_model_id"].nil?
  detailed(params)
    .joins("JOIN grit_assays_assay_model_metadata grit_assays_assay_model_metadata__ " \
           "on ... and grit_assays_assay_model_metadata__.assay_model_id = #{params["assay_model_id"]}")
    .select("grit_assays_assay_model_metadata__.id as assay_model_metadatum_id")
end
```

`params["assay_model_id"]` is interpolated raw into the `JOIN ... ON ... = #{...}`
(unguarded `.joins` sink) — the exact pattern fixed in `data_table_entity.rb`.

Reached via the generic index with `?scope=by_assay_model` (the controller uses
the standard `Authorized#check_read`, i.e. a plain `read:system` permission check
with **no `find` gate** — unlike #3). The value sits in an `ON` predicate, so
boolean/subquery injection applies.

### How it can be exploited

`read:system` required; the marker reflects via the executed `CAST` (error leaks
through finding D; `index` has no rescue → verbose 500):

```bash
curl -s -G "http://localhost:3000/api/grit/assays/assay_metadata_definitions" \
  -H "Authorization: Bearer <token>" \
  --data-urlencode 'scope=by_assay_model' \
  --data-urlencode 'assay_model_id=0 OR (SELECT CAST($$grit_sqli_probe$$ AS int)) IS NOT NULL'
```

- **Vulnerable** → `ON ... assay_model_id = 0 OR (SELECT
  CAST($$grit_sqli_probe$$ AS int)) IS NOT NULL`; the CAST runs and the response
  leaks `invalid input syntax for type integer: "grit_sqli_probe"`.
- **Fixed** → `"0 OR ...".to_i == 0` → `assay_model_id = 0`; the payload is gone
  and the query returns normally.

### How it could be fixed — **Done**

```ruby
assay_model_id = params["assay_model_id"].to_i
# ... interpolate assay_model_id
```

Identical to commit `5a49425e`.

---

## 5. `data_types_controller#guess_data_type_for_columns` — MEDIUM (second-order)

**File:** `modules/core/backend/app/controllers/grit/core/data_types_controller.rb:35, 37, 72`

```ruby
data_type_names_queries.push(
  "SELECT \"#{display_property[:name]}\" as value_name, #{data_type.id} as data_type_id, " \
  "'#{data_type.name}' as data_type_name FROM \"#{data_type.table_name}\"")          # :35
...
res = ActiveRecord::Base.connection.execute(query)                                    # :72
```

`display_property[:name]`, `data_type.name`, and `table_name` are interpolated
into a raw `execute` (unguarded sink). They are not request params, but
`data_type.name` is **user-controllable second-order**: for a vocabulary-backed
data type, `DataType.name` is set to the **vocabulary's name**
(`vocabulary.rb:52`, `data_type.name = self.name`). Vocabulary names are
user-settable (`write: ["admin:vocabularies"]`) with **no format validation**, so
a name containing `'` breaks out of the `'#{data_type.name}'` literal.
(`params[:columns]` is parameterized — `sanitize_sql_array(["(?,?)", …])`, `:48`;
`vocabulary_id` is `.to_i`.)

### How it can be exploited

Two-step, second-order. (1) A holder of `admin:vocabularies` creates a vocabulary
named:
```
'||(SELECT CAST($$grit_sqli_probe$$ AS int))||'
```
(2) **Any** authenticated user calls the trigger — `guess_data_type_for_columns`
is only behind `Authenticated` (the `check_read` before_action covers just
`index/show/export`):
```bash
curl -s "http://localhost:3000/api/grit/core/data_types/guess_data_type_for_columns" \
  -H "Authorization: Bearer <token>" \
  --data-urlencode 'columns[col1][]=foo'
```
- **Vulnerable** → the literal becomes `'' || (SELECT CAST($$grit_sqli_probe$$ AS
  int)) || ''`; the CAST executes → `invalid input syntax for type integer:
  "grit_sqli_probe"`.
- **Fixed** → `connection.quote` escapes the name; the endpoint returns
  `{"success":true,...}`.

### How it could be fixed — **Done**

Quote every interpolated metadata value at the build site (lines 35/38/40):
`connection.quote(data_type.name)` for the literal,
`connection.quote_column_name(display_property[:name])` and
`connection.quote_table_name(data_type.table_name)` for identifiers, and
`data_type.id.to_i`. Neutralizes the injection regardless of metadata content.

---

## Verified NOT vulnerable

- **`modules/core/backend/app/models/grit/core/role.rb:31`** —
  `params[:role_name]` is interpolated only into a `RequestStore` cache **key**;
  the database lookup uses `find_by(name: params[:role_name])`, which is
  parameterized by ActiveRecord. No SQL injection.

---

## Summary

| # | Location | Vector | Sink | Severity | Status |
|---|----------|--------|------|----------|--------|
| 1 | `readable.rb:58` (`:34`) | `sort` direction | `.order` (guarded) | LOW (framework-mitigated) | Fixed (defense-in-depth) |
| 2 | `readable.rb:38` | raw-SQL scope filter `property` | `.where` (unguarded) | HIGH (confirmed) | Fixed |
| 3 | `load_set_block.rb:70,76,89` | `params[:id]` → table name | `.from`/`.joins`/`.where` | HIGH | Fixed |
| 4 | `assay_metadata_definition.rb:48` | `params["assay_model_id"]` → JOIN | `.joins` | HIGH | Fixed |
| 5 | `data_types_controller.rb:35,37` | vocabulary name → `DataType.name` (second-order) | `execute` | MEDIUM | Fixed |

**Triage rule (learned during testing):** exploitability depends on the **sink
method**. Only `.order/.reorder/.pluck` (plus `in_order_of`, `insert_all`)
arguments are validated by Rails `disallow_raw_sql!`, so raw interpolation there
is blocked (→ finding #1). `.where`, `.joins`, `.from`, `.select`, `.group`,
`.having`, `find_by_sql`, and `execute` execute raw strings and remain
exploitable (→ findings #2-filter, #3, #4, #5).

**Common remediation themes:** coerce numeric params with `.to_i`; whitelist
fixed-vocabulary tokens (sort direction → `ASC`/`DESC`); validate or
`quote_column_name` any identifier/column name that must be interpolated; and
remember that `sanitize_sql_array` only sanitizes the values bound to `?`
placeholders, not the surrounding format string.
