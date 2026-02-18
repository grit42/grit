# Assays Backend Testing Improvement Plan

## Overview

The backend assays module (`modules/assays/backend/`) has scaffolded but non-functional tests. This document tracks the plan to implement comprehensive testing for the module.

## Current State

- **15 model test files**: All empty stubs with commented-out placeholder code
- **13 controller test files**: Reference non-existent fixtures, will fail if run
- **0 fixtures**: `test/fixtures/grit/assays/` directory is empty
- **Test helper**: Missing `logout` helper method

## Goal

Implement essential test coverage for core workflows, with additional coverage for simpler entities as time permits.

---

## Progress Tracking

### Phase 1: Foundation (HIGH PRIORITY) - COMPLETED

| Task                                                   | Status | Notes                              |
| ------------------------------------------------------ | ------ | ---------------------------------- |
| Fix `test/test_helper.rb` - add logout helper          | DONE   |                                    |
| Update core `publication_statuses.yml` - add published | DONE   | Core fixture shared by all modules |
| Add `csv` gem to Gemfile (Ruby 3.4 compatibility)      | DONE   | Required for entity_loader         |
| Create `assay_types.yml` fixture                       | DONE   |                                    |
| Create `assay_models.yml` fixture                      | DONE   | Draft & published models           |
| Create `assay_data_sheet_definitions.yml` fixture      | DONE   |                                    |
| Create `assay_data_sheet_columns.yml` fixture          | DONE   |                                    |
| Create `assay_metadata_definitions.yml` fixture        | DONE   |                                    |
| Create `assay_model_metadata.yml` fixture              | DONE   |                                    |
| Create `experiments.yml` fixture                       | DONE   |                                    |
| Create `experiment_metadata.yml` fixture               | DONE   |                                    |
| Verify fixtures load correctly                         | DONE   | Test passes                        |

### Phase 2: Core Model Tests (HIGH PRIORITY) - COMPLETED

| Task                                  | Status | Notes                                                                |
| ------------------------------------- | ------ | -------------------------------------------------------------------- |
| `assay_model_test.rb`                 | DONE   | Associations, publication status callback, create_tables/drop_tables |
| `assay_data_sheet_definition_test.rb` | DONE   | Dynamic table creation, sheet_record_klass generation                |
| `experiment_test.rb`                  | DONE   | Metadata handling, publication status, detailed scope                |

### Phase 3: Core Controller Tests (HIGH PRIORITY) - COMPLETED

| Task                              | Status | Notes                                          |
| --------------------------------- | ------ | ---------------------------------------------- |
| `assay_models_controller_test.rb` | DONE   | CRUD, publish/draft lifecycle, update_metadata |
| `experiments_controller_test.rb`  | DONE   | CRUD with metadata, publish/draft, export ZIP  |

### Phase 4: Simple Entity Tests (LOW PRIORITY)

| Task                                                          | Status | Notes                    |
| ------------------------------------------------------------- | ------ | ------------------------ |
| `assay_type_test.rb` + controller                             | TODO   | Basic CRUD               |
| `assay_metadata_definition_test.rb` + controller              | TODO   | Basic CRUD               |
| `assay_data_sheet_column_test.rb` + controller                | TODO   |                          |
| `assay_model_metadatum_test.rb` + controller                  | TODO   |                          |
| `experiment_metadatum_test.rb` + controller                   | TODO   |                          |
| `data_table_test.rb` + controller                             | TODO   |                          |
| `data_table_column_test.rb` + controller                      | TODO   |                          |
| `data_table_row_test.rb` + controller                         | TODO   |                          |
| `data_table_entity_test.rb` + controller                      | TODO   |                          |
| `experiment_metadata_template_test.rb` + controller           | TODO   |                          |
| `experiment_metadata_template_metadatum_test.rb` + controller | TODO   |                          |
| `experiment_data_sheet_record_test.rb` + controller           | TODO   | Complex - dynamic tables |
| `experiment_data_sheet_record_load_set_test.rb`               | TODO   |                          |

### Phase 5: Verification

| Task                | Status | Notes                                  |
| ------------------- | ------ | -------------------------------------- |
| Run full test suite | TODO   | `rails test` in modules/assays/backend |
| Fix any failures    | TODO   |                                        |

---

## Key Files Reference

### Models to Test (by priority)

**High Priority - Core Workflow:**

- `app/models/grit/assays/assay_model.rb` - Publication lifecycle, dynamic table creation
- `app/models/grit/assays/assay_data_sheet_definition.rb` - Dynamic `ds_{id}` tables, `sheet_record_klass`
- `app/models/grit/assays/experiment.rb` - Metadata handling, publication status

**Low Priority - Supporting Entities:**

- `app/models/grit/assays/assay_type.rb` - Simple lookup
- `app/models/grit/assays/assay_metadata_definition.rb` - Links to vocabularies
- `app/models/grit/assays/assay_data_sheet_column.rb` - Column definitions
- `app/models/grit/assays/assay_model_metadatum.rb` - M2M link
- `app/models/grit/assays/experiment_metadatum.rb` - Experiment metadata values
- `app/models/grit/assays/data_table.rb` - Custom data tables
- `app/models/grit/assays/data_table_column.rb`
- `app/models/grit/assays/data_table_row.rb`
- `app/models/grit/assays/data_table_entity.rb`
- `app/models/grit/assays/experiment_metadata_template.rb`
- `app/models/grit/assays/experiment_metadata_template_metadatum.rb`
- `app/models/grit/assays/experiment_data_sheet_record.rb` - Uses dynamic tables
- `app/models/grit/assays/experiment_data_sheet_record_load_set.rb`
- `app/models/grit/assays/experiment_data_sheet_record_load_set_block.rb`

### Controllers to Test (by priority)

**High Priority:**

- `app/controllers/grit/assays/assay_models_controller.rb` - Custom create, publish/draft
- `app/controllers/grit/assays/experiments_controller.rb` - Custom create/update, export

**Low Priority:**

- `app/controllers/grit/assays/assay_types_controller.rb`
- `app/controllers/grit/assays/assay_metadata_definitions_controller.rb`
- `app/controllers/grit/assays/assay_data_sheet_definitions_controller.rb`
- `app/controllers/grit/assays/assay_data_sheet_columns_controller.rb`
- `app/controllers/grit/assays/assay_model_metadata_controller.rb`
- `app/controllers/grit/assays/experiment_metadata_controller.rb`
- `app/controllers/grit/assays/data_tables_controller.rb`
- `app/controllers/grit/assays/data_table_columns_controller.rb`
- `app/controllers/grit/assays/data_table_rows_controller.rb`
- `app/controllers/grit/assays/data_table_entities_controller.rb`
- `app/controllers/grit/assays/experiment_metadata_templates_controller.rb`
- `app/controllers/grit/assays/experiment_metadata_template_metadata_controller.rb`
- `app/controllers/grit/assays/experiment_data_sheet_records_controller.rb`

---

## Testing Patterns to Follow

### Model Test Template

```ruby
module Grit::Assays
  class ModelNameTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @record = grit_assays_model_names(:one)
    end

    # Test associations
    test "should belong to parent" do
      assert_equal grit_assays_parents(:one), @record.parent
    end

    # Test validations
    test "should require name" do
      record = ModelName.new(name: nil)
      assert_not record.valid?
      assert_includes record.errors[:name], "can't be blank"
    end

    # Test callbacks
    test "callback should prevent modification when published" do
      @record.publication_status = grit_core_publication_statuses(:published)
      @record.save!

      assert_raises(RuntimeError) do
        @record.update!(name: "changed")
      end
    end

    # Test scopes
    test "detailed scope includes related data" do
      result = ModelName.detailed.find(@record.id)
      assert_respond_to result, :parent_id__name
    end
  end
end
```

### Controller Test Template

```ruby
module Grit::Assays
  class ModelNamesControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @record = grit_assays_model_names(:one)
    end

    test "should get index" do
      get model_names_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
    end

    test "should create record" do
      assert_difference("ModelName.count") do
        post model_names_url, params: { name: "new", ... }, as: :json
      end
      assert_response :created
    end

    test "should show record" do
      get model_name_url(@record), as: :json
      assert_response :success
    end

    test "should update record" do
      patch model_name_url(@record), params: { name: "updated" }, as: :json
      assert_response :success
    end

    test "should destroy record" do
      assert_difference("ModelName.count", -1) do
        delete model_name_url(@record), as: :json
      end
      assert_response :success
    end
  end
end
```

---

## Key Business Logic to Test

### AssayModel Lifecycle

1. **Draft state**: Can modify sheets, columns, metadata
2. **Publish action**:
   - Changes publication_status to "Published"
   - Calls `create_tables` which creates `ds_{id}` tables for each sheet
3. **Published state**: Cannot modify (raises error)
4. **Draft action** (unpublish):
   - Changes publication_status back to "Draft"
   - Calls `drop_tables` to remove dynamic tables
   - Destroys all experiments
   - Destroys data_table_columns referencing sheet columns

### Experiment Lifecycle

1. **Create**: Sets publication_status to Draft, handles metadata values
2. **Update**: Updates metadata values via `set_metadata_values`
3. **Publish**: Changes to Published status
4. **Published state**: Cannot modify (raises error in `check_publication_status` callback)
5. **Destroy**: Calls `delete_records` to remove records from dynamic tables

### Dynamic Table System

- `AssayDataSheetDefinition#table_name` returns `ds_{id}`
- `AssayDataSheetDefinition#create_table` creates actual PostgreSQL table
- `AssayDataSheetDefinition#drop_table` drops the table
- `AssayDataSheetDefinition#sheet_record_klass` generates an ActiveRecord class at runtime
- Tests should create real tables and verify they work

---

## Dependencies

### Core Fixtures Used (already exist)

- `grit_core_users(:admin)` - Admin user for authentication
- `grit_core_users(:notadmin)` - Non-admin user for permission tests
- `grit_core_publication_statuses(:draft)` - Draft status
- `grit_core_publication_statuses(:published)` - Added
- `grit_core_data_types(:integer)` - Integer data type
- `grit_core_data_types(:string)` - String data type
- `grit_core_vocabularies(:*)` - For metadata definitions
- `grit_core_vocabulary_items(:*)` - For metadata values

### Roles Needed for Permission Tests

- Administrator - full access
- AssayAdministrator - can manage assay models
- AssayUser - can manage experiments

---

## Running Tests

```bash
cd modules/assays/backend
bundle exec rails test

# Run specific test file
bundle exec rails test test/models/grit/assays/assay_model_test.rb

# Run specific test
bundle exec rails test test/models/grit/assays/assay_model_test.rb:42
```

---

## Notes for Future Sessions

- The assays module test helper already includes core fixtures via `Grit::Core::Engine.root.join("test", "fixtures")`
- Dynamic tables (`ds_{id}`) are excluded from `schema.rb` via `SchemaDumper.ignore_tables`
- When testing dynamic table creation, ensure cleanup in teardown to avoid table pollution
- The `ExperimentDataSheetRecord` model is especially complex as it uses `sheet_record_klass` for all operations
