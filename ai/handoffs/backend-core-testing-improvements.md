# Backend Core Module Testing Improvements

**Status:** Ready for implementation  
**Priority:** Medium  
**Estimated effort:** 4-6 hours across multiple sessions

## Overview

The backend core module (`modules/core/backend/`) has testing issues that need addressing:

1. 14 model test files are empty placeholders with no actual tests
2. Controller tests have significant duplication across similar entity patterns
3. Complex business logic in several models lacks unit test coverage

## Current Test Structure

```
modules/core/backend/test/
├── controllers/grit/core/     # 13 controller integration tests
├── models/grit/core/          # 15 model tests (14 empty, 1 active)
├── fixtures/grit/core/        # YAML fixtures for test data
├── grit/                      # Library tests (minimal)
├── dummy/                     # Rails dummy app for engine testing
└── test_helper.rb             # Test configuration
```

### Test Helper Location

`modules/core/backend/test/test_helper.rb` provides:

- Authlogic test case setup
- `login(user, password)` and `logout` helper methods
- Fixture loading from engine and dummy app

## Phase 1: Clean Up Empty/Redundant Tests

### 1.1 Delete Empty Placeholder Model Tests

Delete these files - they contain only commented-out boilerplate:

```
modules/core/backend/test/models/grit/core/
├── country_test.rb              # DELETE
├── data_type_test.rb            # DELETE (will recreate with real tests)
├── load_set_loaded_record_test.rb  # DELETE
├── load_set_status_test.rb      # DELETE
├── load_set_test.rb             # DELETE (will recreate with real tests)
├── location_test.rb             # DELETE
├── origin_test.rb               # DELETE
├── publication_status_test.rb   # DELETE
├── role_test.rb                 # DELETE (will recreate with real tests)
├── unit_test.rb                 # DELETE
├── user_role_test.rb            # DELETE (will recreate with real tests)
├── user_test.rb                 # DELETE (will recreate with real tests)
├── vocabulary_item_load_set_test.rb  # DELETE
├── vocabulary_item_test.rb      # DELETE
└── vocabulary_test.rb           # KEEP - has actual tests
```

### 1.2 Create Shared Controller Test Helper

Create `modules/core/backend/test/support/grit_entity_controller_test_helper.rb`:

```ruby
# frozen_string_literal: true

module GritEntityControllerTestHelper
  extend ActiveSupport::Concern

  included do
    include Grit::Core::Engine.routes.url_helpers
    include Authlogic::TestCase
  end

  # Asserts read-only entity behavior (index/show allowed, create/update/destroy forbidden)
  # Used by: Country, Role, DataType, LoadSetStatus, PublicationStatus
  def assert_read_only_crud(index_url:, show_url:, create_url: nil, create_params: {})
    get index_url, as: :json
    assert_response :success, "Expected index to succeed"

    get show_url, as: :json
    assert_response :success, "Expected show to succeed"

    url = create_url || index_url
    assert_no_difference(-> { model_class.count }) do
      post url, params: create_params, as: :json
    end
    assert_response :forbidden, "Expected create to be forbidden"
  end

  # Asserts admin-only CRUD (anyone can read, only admin can write)
  # Used by: Location, Origin, Unit
  def assert_admin_only_crud(
    index_url:, show_url:, create_url:, update_url:, destroy_url:,
    create_params:, update_params:, admin_user:, non_admin_user:
  )
    login(non_admin_user)
    get index_url, as: :json
    assert_response :success

    get show_url, as: :json
    assert_response :success

    assert_no_difference(-> { model_class.count }) do
      post create_url, params: create_params, as: :json
    end
    assert_response :forbidden

    patch update_url, params: update_params, as: :json
    assert_response :forbidden

    assert_no_difference(-> { model_class.count }) do
      delete destroy_url, as: :json
    end
    assert_response :forbidden

    login(admin_user)
    assert_difference(-> { model_class.count }) do
      post create_url, params: create_params, as: :json
    end
    assert_response :created

    patch update_url, params: update_params, as: :json
    assert_response :success

    assert_difference(-> { model_class.count }, -1) do
      delete destroy_url, as: :json
    end
    assert_response :success
  end

  private

  def model_class
    raise NotImplementedError, "Subclass must define model_class"
  end
end
```

Update `test_helper.rb` to require support files:

```ruby
Dir[File.expand_path("support/**/*.rb", __dir__)].each { |f| require f }
```

### 1.3 Refactor Controller Tests

| File                           | Pattern    | Action                       |
| ------------------------------ | ---------- | ---------------------------- |
| `countries_controller_test.rb` | read-only  | Use `assert_read_only_crud`  |
| `roles_controller_test.rb`     | read-only  | Use `assert_read_only_crud`  |
| `locations_controller_test.rb` | admin-only | Use `assert_admin_only_crud` |
| `origins_controller_test.rb`   | admin-only | Use `assert_admin_only_crud` |
| `units_controller_test.rb`     | admin-only | Use `assert_admin_only_crud` |

**Keep as-is** (unique tests): `users_controller_test.rb`, `load_sets_controller_test.rb`

## Phase 2: Add Missing Unit Tests

### 2.1 User Model Tests (HIGH PRIORITY)

Create `modules/core/backend/test/models/grit/core/user_test.rb` testing:

- **Email validation:** valid/invalid formats via regex
- **Login validation:** valid/invalid formats
- **`active?` method:** truthy/falsy value conversion
- **`role?` / `one_of_these_roles?`:** role checking with caching
- **`check_who` callback:** authorization (admin edits others, users edit self)
- **`check_admin_active`:** prevents admin deactivation
- **`validate_fields`:** prevents login changes after creation
- **`validate_two_factor`:** requires email for 2FA
- **`set_default_values`:** downcases login/email
- **`random_password`:** generates secure password
- **`check_dependencies`:** prevents deleting admin user

### 2.2 UserRole Model Tests (HIGH PRIORITY)

Create `modules/core/backend/test/models/grit/core/user_role_test.rb` testing:

- **`check_role`:** requires Administrator role to manage user roles
- **`check_dependencies`:** prevents removing Administrator role from admin

### 2.3 LoadSetBlock Model Tests (HIGH PRIORITY)

Create `modules/core/backend/test/models/grit/core/load_set_block_test.rb` testing:

- **`separator_set` validation:** tab allowed, blank rejected for others
- **`check_status` callback:** prevents deletion of succeeded blocks
- **Dynamic table creation:** `create_raw_data_table`, `seed_raw_data_table`

### 2.4 LoadSet Model Tests (MEDIUM PRIORITY)

Create `modules/core/backend/test/models/grit/core/load_set_test.rb` testing:

- **`check_status`:** prevents deletion when blocks succeeded
- **`rollback`:** sets blocks to errored status
- **Scopes:** `by_entity`, `by_vocabulary`

### 2.5 DataType Model Tests (MEDIUM PRIORITY)

Create `modules/core/backend/test/models/grit/core/data_type_test.rb` testing:

- **`sql_name`:** converts "integer" to "bigint", raises for entity types
- **`entity_definition`:** nil for non-entities, hash for entities
- **`model_scope`:** vocabulary filtering for VocabularyItem

### 2.6 Role Model Tests (MEDIUM PRIORITY)

Create `modules/core/backend/test/models/grit/core/role_test.rb` testing:

- **`access?`:** checks if current user has role, uses RequestStore caching

## Phase 3: GritEntityRecord Concern Tests

Create `modules/core/backend/test/models/concerns/grit_entity_record_test.rb` testing:

- Auto-validation from database schema (uniqueness, presence, length)
- `numbers_in_range` validation for safe integers
- `set_updater` populating created_by/updated_by
- `entity_crud_with` permission checking

Use `TestEntity` from dummy app to test concern behavior.

## Running Tests

```bash
cd modules/core/backend
bundle exec rails test                           # all tests
bundle exec rails test test/models/              # model tests only
bundle exec rails test test/controllers/         # controller tests only
bundle exec rails test -v                        # verbose output
```

## Key Fixtures Reference

| Fixture                 | Key Records                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| `users.yml`             | `admin` (has Administrator role), `notadmin` (regular user)                    |
| `roles.yml`             | `one` (Administrator), `two` (AnotherRole)                                     |
| `load_sets.yml`         | `test_entity_mapping`, `test_entity_succeeded`, `test_entity_missing_required` |
| `load_set_statuses.yml` | Mapping, Validated, Succeeded, Errored                                         |

## Model Callbacks Reference

### User Model

```ruby
before_validation :random_password, on: :create
before_create :set_default_values
before_create :check_user
before_update :check_who
before_update :check_admin_active
before_update :validate_fields
before_update :validate_two_factor
after_update :new_session
before_destroy :check_dependencies
```

### LoadSetBlock Model

```ruby
before_destroy :check_status
before_destroy :drop_tables
after_save :drop_tables_if_succeeded
validates with: :separator_set (custom)
```

### UserRole Model

```ruby
before_create :check_role
before_update :check_role
before_destroy :check_dependencies
```

## Checklist

### Phase 1: Cleanup (COMPLETED)

- [x] Delete 14 empty placeholder model test files
- [x] Create `test/support/grit_entity_controller_test_helper.rb`
- [x] Update `test_helper.rb` to require support files
- [x] Refactor `countries_controller_test.rb`
- [x] Refactor `roles_controller_test.rb`
- [x] Refactor `locations_controller_test.rb`
- [x] Refactor `origins_controller_test.rb`
- [x] Refactor `units_controller_test.rb`
- [x] Fix broken fixtures:
  - Renamed `load_set_loaded_records.yml` to `load_set_block_loaded_records.yml`
  - Fixed `load_sets.yml` to match current schema (removed obsolete columns)

### Phase 2: New Unit Tests

- [ ] Create `user_test.rb` (~20 tests)
- [ ] Create `user_role_test.rb` (~5 tests)
- [ ] Create `load_set_block_test.rb` (~8 tests)
- [ ] Create `load_set_test.rb` (~5 tests)
- [ ] Create `data_type_test.rb` (~5 tests)
- [ ] Create `role_test.rb` (~3 tests)

### Phase 3: Concern Tests

- [ ] Create `grit_entity_record_test.rb` (~10 tests)

### Verification

- [ ] Run full test suite passes
- [ ] No regressions in existing tests

## Side Quest: Fix Pre-existing Test Failures

During Phase 1, several pre-existing test failures were discovered that are unrelated to the refactoring work. These should be addressed separately.

### Issue 1: UsersController double render error (FIXED)

**File:** `test/controllers/grit/core/users_controller_test.rb:78`
**Test:** `test_not_admin_should_not_show_user_for_user_admin`
**Error:** `AbstractController::DoubleRenderError` in `grit_entity_controller.rb:176`

**Fix:** Added `return if performed?` check in `GritEntityController#show` after calling `show_entity(params)`. When `get_scope` renders a `:bad_request` error (e.g., non-admin accessing `user_administration` scope), the `performed?` check prevents the `show` method from attempting a second render.

### Issue 2: LoadSetsController tests assume old schema

**Files:** `test/controllers/grit/core/load_sets_controller_test.rb`
**Tests:** Multiple failures (8 tests)

The `LoadSet` model schema has changed significantly:

- Old schema had: `mappings`, `data`, `parsed_data`, `status_id` columns
- Current schema has: `id`, `name`, `entity`, `origin_id` only

The tests reference the old API that expected data/mappings on LoadSet directly. The data loading logic has moved to `LoadSetBlock` model. These tests need to be rewritten to match the current architecture.

**Affected tests:**

- `test_should_create_load_set` - expects `load_set_blocks` params
- `test_should_update_mapping_load_set,_validate_and_confirm`
- `test_should_update_load_set_and_fail_to_validate_*` (multiple)
- `test_should_not_destroy_succeeded_load_set`
- `test_should_rollback_and_destroy_load_set`

### Recommended approach

1. Review the current `LoadSet` and `LoadSetBlock` models to understand the new data loading flow
2. Rewrite `load_sets_controller_test.rb` to test the current API
3. Fix the double render issue in `GritEntityController#show`
