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

**Written:**
- `entity_loader_test.rb` — 25 tests, 60 assertions: loader dispatch, fields/block_fields, `validate_record_properties` (all mapping/type/uniqueness paths), mapping_fields

---

## Compounds Module (11 files) ✅ Phase 1 done

**Deleted:**
- All 8 empty placeholder model test files:
  `batch_property_test.rb`, `batch_property_value_test.rb`, `compound_property_test.rb`, `compound_property_value_test.rb`, `synonym_test.rb`, `compound_type_test.rb`, `batch_load_set_test.rb`, `compound_load_set_test.rb`

**Trimmed:**
- `batch_test.rb` — removed 2 `entity_properties` tests + 2 `entity_fields`/`entity_columns` tests
- `compound_test.rb` — same
- `compound_loader_test.rb` — removed 2 molecule parsing tests from `validate_record` (existing molecule warning + invalid molfile error); covered by SDF unit test and integration test

**Keep (module-specific):**
- SMILES/molfile conversion and molecule deduplication logic
- Auto-numbering callbacks (GRIT/BATCH prefix generation)
- `find_by_name_or_synonyms`, `loader_find_by!` lookup methods
- All loader tests (`batch_loader_test.rb`, `compound_loader_test.rb`, `sdf_test.rb`)
- Integration tests (`batch_loading_test.rb`, `compound_loading_test.rb`)

---

## Assays Module (34 files) ✅ Phase 1 done

**Deleted:**
- `test/integration/navigation_test.rb` — empty skeleton

**Trimmed entity_properties/fields/columns tests:**
- `assay_type_test.rb` — removed generic "has entity properties configured"
- `assay_metadata_definition_test.rb` — same
- `assay_data_sheet_column_test.rb` — same
- `data_table_test.rb` — removed generic check; kept module-specific `plots` exclusion and `entity_data_type_id` scope tests
- `experiment_metadata_template_test.rb` — removed generic check
- `data_table_row_test.rb` — removed 3 `respond_to?` checks for entity_properties/fields/columns
- `data_table_entity_test.rb` — same

**Trimmed safe_name rule repetition:**
- `assay_metadata_definition_test.rb` — removed 4 generic rule tests (min/max length, start, charset); kept uniqueness check and Experiment method conflict
- `assay_data_sheet_column_test.rb` — removed 4 generic rule tests; kept uniqueness within sheet and reserved names conflict
- `data_table_column_test.rb` — removed 3 of 4 rule tests; kept minimum length as the single confirming test

**Trimmed controller-layer publication status duplication:**
- `assay_models_controller_test.rb` — removed "should not update published assay_model"
- `experiments_controller_test.rb` — removed "should not update published experiment" and "published experiment cannot be modified"

**Keep (module-specific):**
- Dynamic table creation/dropping (`AssayModel`, `AssayDataSheetDefinition`) — genuinely unique behavior
- `sheet_record_klass` dynamic ActiveRecord class generation
- `set_metadata_values` on Experiment and ExperimentMetadataTemplate
- `ExperimentDataSheetRecord` audit fields (created_by/updated_by) — these go through the dynamic klass, not standard GritEntityRecord
- Publication status lifecycle (publish/draft actions with table create/drop side effects)
- `AssayMetadataDefinition` safe_name conflict check against Experiment column names — domain-specific
- `ExperimentDataSheetRecord` controller publication-protection tests (create/update/destroy blocked on published experiment) — no model-layer coverage for this

**Remaining gaps:**
- DataTable controller tests are near-empty stubs ("requires seeds") — fix or remove; they add noise without coverage
- `ExperimentMetadataTemplate` tests create templates but never apply them to experiments

---

## Summary Table

### Phase 1 ✅ Complete

| Action | Target |
|--------|--------|
| Delete | 8 empty compound model test files |
| Delete | Empty assay integration skeleton |
| Remove | entity_properties/fields/columns tests from compounds & assays |
| Remove | Redundant safe_name rule tests in assays (keep one per model) |
| Remove | Controller-layer publication status tests where model test covers it |
| Consolidate | Molecule parsing assertions → SDF unit test + integration test only |

### Phase 2 ✅ Complete

| Action | Target |
|--------|--------|
| Write | Core `entity_loader_test.rb` — 25 tests, 60 assertions covering loader dispatch, fields/block_fields, `validate_record_properties` (all 9 mapping/type/uniqueness paths), and mapping_fields |

### Phase 3

| Action | Target |
|--------|--------|
| Fix or delete | DataTable controller stubs in assays |
