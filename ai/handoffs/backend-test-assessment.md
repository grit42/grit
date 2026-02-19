# Backend Test Assessment

Goal: slim test suites that test module-specific behavior, not generic framework behavior.

## Core Principle

`GritEntityRecord` behavior (entity_properties, entity_fields, entity_columns, detailed scope, audit fields, auto-validation, set_updater callback) is **fully covered in core's `grit_entity_record_test.rb`** (41 assertions). Modules must not re-test it.

---

## Core Module (23 files)

**Keep as-is:**
- `grit_entity_record_test.rb` — canonical concern test, do not touch
- `user_test.rb`, `user_role_test.rb` — complex domain logic
- `load_set_test.rb`, `load_set_block_test.rb` — importer lifecycle
- Controller tests using `assert_read_only_entity` / `assert_admin_only_crud` helpers

**Gap:**
- `entity_loader_test.rb` is an empty TODO stub — the import framework has zero test coverage. Either write tests or delete the file.

---

## Compounds Module (19 files, 8 empty)

**Delete (no value):**
- All 8 empty placeholder model test files:
  `batch_property_test.rb`, `batch_property_value_test.rb`, `compound_property_test.rb`, `compound_property_value_test.rb`, `synonym_test.rb`, `compound_type_test.rb`, `batch_load_set_test.rb`, `compound_load_set_test.rb`

**Trim from `batch_test.rb` and `compound_test.rb`:**
- Remove all entity_properties / entity_fields / entity_columns assertions — already covered by core

**Keep (module-specific):**
- SMILES/molfile conversion and molecule deduplication logic
- Auto-numbering callbacks (GRIT/BATCH prefix generation)
- `find_by_name_or_synonyms`, `loader_find_by!` lookup methods
- All loader tests (`batch_loader_test.rb`, `compound_loader_test.rb`, `sdf_test.rb`)
- Integration tests (`batch_loading_test.rb`, `compound_loading_test.rb`)

**Redundancy to address:**
- Molecule parsing is asserted in 3 places (CompoundLoader validate_record, SDF unit test, integration test). Keep the SDF unit test and integration test; the CompoundLoader assertions are covered by those.

---

## Assays Module (35 files)

**Trim from every model test:**
- Remove entity_properties / entity_fields / entity_columns tests — covered by core

**Trim safe_name validation repetition:**
- The same safe_name rules (3–30 chars, lowercase/numbers/underscores, no reserved names) are tested across 5+ models: `AssayMetadataDefinition`, `AssayDataSheetColumn`, `DataTableColumn`, etc.
- Keep: one test per model confirming the constraint is enforced at all
- Remove: repetitive tests of the same rule (length, charset, uniqueness) on each model

**Trim publication status protection repetition:**
- The "published model can't be modified" pattern is tested at both model and controller layers for ~4 entities (AssayModel, AssayDataSheetDefinition, Experiment, ExperimentDataSheetRecord)
- Keep: model-layer tests — this is where the constraint lives
- Remove: controller-level duplication where the model test already proves the constraint

**Keep (module-specific):**
- Dynamic table creation/dropping (`AssayModel`, `AssayDataSheetDefinition`) — genuinely unique behavior
- `sheet_record_klass` dynamic ActiveRecord class generation
- `set_metadata_values` on Experiment and ExperimentMetadataTemplate
- `ExperimentDataSheetRecord` audit fields (created_by/updated_by) — these go through the dynamic klass, not standard GritEntityRecord
- Publication status lifecycle (publish/draft actions with table create/drop side effects)
- `AssayMetadataDefinition` safe_name conflict check against Experiment column names — domain-specific

**Gaps:**
- DataTable controller tests are near-empty stubs ("requires seeds") — fix or remove; they add noise without coverage
- `test/integration/` is an empty skeleton — write one smoke test or delete
- `ExperimentMetadataTemplate` tests create templates but never apply them to experiments

---

## Summary Table

### Phase 1

| Action | Target |
|--------|--------|
| Delete | 8 empty compound model test files |
| Delete | Empty assay integration skeleton |
| Remove | entity_properties/fields/columns tests from compounds & assays |
| Remove | Redundant safe_name rule tests in assays (keep one per model) |
| Remove | Controller-layer publication status tests where model test covers it |
| Consolidate | Molecule parsing assertions → SDF unit test + integration test only |

### Phase 2

| Action | Target |
|--------|--------|
| Write or delete | Core `entity_loader_test.rb` empty stub |
| Fix or delete | DataTable controller stubs in assays |
