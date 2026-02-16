# Test Coverage Improvement Plan for Grit Compounds Backend

## Overview

This plan outlines the steps to improve test coverage in the `modules/compounds/backend` directory. Currently, there are significant gaps in testing for critical components including the molecules controller, data loaders, and SDF parsing functionality.

## Current State Analysis

### ✅ Existing Test Coverage

- **Models**: All 11 models have basic tests (mostly testing `entity_properties`)
- **Controllers**: 6 out of 7 controllers have integration tests
- **Test Results**: 37 runs, 65 assertions, 0 failures, 0 errors, 0 skips

### ❌ Missing Test Coverage

1. **molecules_controller.rb** - No test file exists
2. **compound_loader.rb** - No test file exists
3. **batch_loader.rb** - No test file exists
4. **sdf.rb** - No test file exists
5. **molecule.rb** - Only empty test skeleton exists

## Detailed Implementation Plan

### Phase 1: Setup and Preparation - ✅ COMPLETED

**Objective**: Create necessary test infrastructure and fixtures

#### Task 1.1: Create Test Fixtures for Molecules - ✅ COMPLETED

- **File**: `test/fixtures/grit/compounds/molecules.yml`
- **Content**: Sample molecule records with molfile data and molid values
- **Dependencies**: Existing compound fixtures
- **Status**: ✅ Created with ethanol and propanol molecules

#### Task 1.2: Create Test Fixtures for MoleculesCompounds (join table) - ✅ COMPLETED

- **File**: `test/fixtures/grit/compounds/molecules_compounds.yml`
- **Content**: Associations between molecules and compounds
- **Dependencies**: molecules.yml, compounds.yml
- **Status**: ✅ Created with 3 association records

#### Task 1.3: Create Sample SDF Files for Testing - ✅ COMPLETED

- **Directory**: `test/fixtures/files/`
- **Files**:
  - `simple.sdf` - Basic SDF with one molecule (ethanol)
  - `multiple.sdf` - SDF with multiple molecules (ethanol + propanol)
  - `malformed.sdf` - Invalid SDF for error testing
  - `with_properties.sdf` - SDF with custom properties
- **Status**: ✅ All files created and ready for use

### Phase 2: Model Tests Enhancement

**Objective**: Improve existing model tests with comprehensive coverage

#### Task 2.1: Enhance Molecule Test

- **File**: `test/models/grit/compounds/molecule_test.rb`
- **Tests to add**:
  - Test `by_molfile` class method
  - Test `by_smiles` class method
  - Test validations
  - Test associations (compounds, molecules_compounds)
  - Test calculated properties (molweight, logp, molformula)

#### Task 2.2: Enhance Compound Test

- **File**: `test/models/grit/compounds/compound_test.rb`
- **Tests to add**:
  - Test molecule association and linkage
  - Test compound type filtering
  - Test property value associations
  - Test validation scenarios

#### Task 2.3: Enhance Batch Test

- **File**: `test/models/grit/compounds/batch_test.rb`
- **Tests to add**:
  - Test compound association
  - Test batch property calculations
  - Test validation scenarios

### Phase 3: Controller Tests

**Objective**: Add missing controller tests

#### Task 3.1: Create Molecules Controller Test

- **File**: `test/controllers/grit/compounds/molecules_controller_test.rb`
- **Tests to add**:
  - Test `index` action (CRUD operations via GritEntityController)
  - Test `molecule_exists` action:
    - Test with existing molecule
    - Test with new molecule
    - Test with invalid molfile
    - Test response format and structure
  - Test authentication/authorization
  - Test error handling

### Phase 4: Library Tests (Critical Missing Coverage)

**Objective**: Add comprehensive tests for data loading functionality

#### Task 4.1: Create SDF Library Test

- **File**: `test/lib/grit/compounds/sdf_test.rb`
- **Tests to add**:
  - Test `SDF.properties(io)` method:
    - Parse properties from valid SDF
    - Handle empty SDF
    - Handle SDF with no properties
  - Test `SDF.each_record(io)` method:
    - Parse single record
    - Parse multiple records
    - Handle malformed SDF (raise MalformedSdfFile)
    - Extract molecule blocks correctly
    - Extract property values correctly

#### Task 4.2: Create Compound Loader Test

- **File**: `test/lib/grit/compounds/compound_loader_test.rb`
- **Tests to add**:
  - Test `block_fields` method with different parameters
  - Test `block_set_data_fields` method
  - Test `create` method (load set creation)
  - Test `show` method (load set display)
  - Test `destroy` method (cleanup)
  - Test `base_record_props` method
  - Test `validate_block_context` method
  - Test `validate_record` method:
    - Valid records
    - Invalid structure formats
    - Duplicate molecules
    - Invalid property values
  - Test `confirm_block` method (data loading)
  - Test `rollback_block` method (data cleanup)
  - Test `block_mapping_fields` method
  - Test `block_loading_fields` method
  - Test `set_block_data` method
  - Test `columns_from_sdf` method
  - Test `records_from_sdf` method

#### Task 4.3: Create Batch Loader Test

- **File**: `test/lib/grit/compounds/batch_loader_test.rb`
- **Tests to add**:
  - Test `block_fields` method
  - Test `create` method (load set creation)
  - Test `show` method (load set display)
  - Test `destroy` method (cleanup)
  - Test `base_record_props` method
  - Test `validate_block_context` method
  - Test `validate_record` method:
    - Valid records
    - Invalid property values
  - Test `confirm_block` method (data loading)
  - Test `rollback_block` method (data cleanup)
  - Test `block_mapping_fields` method
  - Test `block_loading_fields` method

### Phase 5: Integration Tests

**Objective**: Add end-to-end workflow tests

#### Task 5.1: Create Compound Loading Integration Test

- **File**: `test/integration/compound_loading_test.rb`
- **Tests to add**:
  - Test full workflow: upload → validate → confirm → verify data
  - Test SDF file loading with molecules
  - Test CSV file loading
  - Test error handling and rollback
  - Test property value creation

#### Task 5.2: Create Batch Loading Integration Test

- **File**: `test/integration/batch_loading_test.rb`
- **Tests to add**:
  - Test full workflow: upload → validate → confirm → verify data
  - Test batch property value creation
  - Test compound association
  - Test error handling and rollback

### Phase 6: Test Quality Improvements

**Objective**: Enhance test reliability and maintainability

#### Task 6.1: Add Test Helper Methods

- **File**: `test/test_helper.rb`
- **Methods to add**:
  - `create_molecule_fixture` - Helper to create test molecules
  - `create_sdf_file` - Helper to generate SDF files
  - `login_as_admin` - Convenience method for auth
  - `login_as_user` - Convenience method for regular users

#### Task 6.2: Add Factory Methods

- **File**: `test/factories.rb` (if using factory_bot)
- **Factories to create**:
  - Molecule factory
  - MoleculesCompound factory
  - Compound with molecule factory
  - Batch with properties factory

## Execution Priority

### High Priority (Critical Missing Coverage)

1. SDF library tests - Core parsing functionality
2. Compound loader tests - Main data import pathway
3. Molecules controller tests - Custom endpoint coverage
4. Molecule model tests - Basic molecule functionality

### Medium Priority (Important but Less Critical)

1. Batch loader tests
2. Integration tests for loading workflows
3. Enhanced model tests

### Low Priority (Nice to Have)

1. Test helper improvements
2. Factory methods

## Estimated Effort

- **Phase 1 (Setup)**: ✅ 2-4 hours - COMPLETED
- **Phase 2 (Model Tests)**: 4-6 hours
- **Phase 3 (Controller Tests)**: 2-3 hours
- **Phase 4 (Library Tests)**: 8-12 hours (most complex)
- **Phase 5 (Integration Tests)**: 4-6 hours

**Total Estimated**: 22-34 hours
**Completed**: Phase 1 (Setup Infrastructure)

## Testing Strategy

### Test Data Approach

- ✅ Use fixtures for basic test data - COMPLETED
- Create helper methods for dynamic test data generation
- Use factory pattern for complex object creation
- ✅ Store sample files in `test/fixtures/files/` directory - COMPLETED

### Test Isolation

- Use transactions for database tests
- Clean up temporary files after tests
- Use `setup` and `teardown` methods appropriately
- Test one concept per test method

### Test Naming Convention

- Descriptive method names: `test "should handle malformed SDF files"`
- Group related tests logically within test classes
- Use context comments to separate test groups

## Risk Assessment

### High Risk Areas

1. **SDF Parsing**: Complex logic, edge cases with malformed files
2. **Data Loading**: Transaction management, rollback scenarios
3. **Molecule Matching**: Chemical structure comparison logic

### Mitigation Strategies

1. Create comprehensive test cases for edge cases
2. Test both success and failure scenarios
3. Use real SDF files from chemical databases for realistic testing
4. Test performance with large files

## Success Criteria

✅ Phase 1: All infrastructure files created and working
✅ Test coverage maintained at 37 runs, 65 assertions, 0 failures  
✅ All critical infrastructure (fixtures, SDF files) ready for use
✅ No regression in existing tests
✅ Test suite runs successfully

## Next Steps

✅ Phase 1 (Setup) - COMPLETED

This plan is ready for execution. The recommended approach is to:

1. ✅ Start with Phase 1 (Setup) to create necessary infrastructure - DONE
2. Proceed to Phase 4 (Library Tests) as this is the most critical missing coverage
3. Continue with Phase 3 (Controller Tests) and Phase 2 (Model Tests)
4. Finish with Phase 5 (Integration Tests) and Phase 6 (Quality)

Each phase can be executed in separate sessions, with progress tracked in this document.

### Phase 4: Critical Library Tests - ✅ COMPLETED

**Implementation Date**: 2026-02-16

**Files Created**:

1. `test/lib/grit/compounds/sdf_test.rb` - 10 comprehensive tests
2. `test/lib/grit/compounds/compound_loader_test.rb` - 4 tests
3. `test/lib/grit/compounds/batch_loader_test.rb` - 4 tests
4. `test/controllers/grit/compounds/molecules_controller_test.rb` - 5 tests

**Test Results**:

- **23 new test runs** added
- **111 new assertions** added
- **0 failures, 0 errors, 0 skips**
- **100% pass rate**

**Coverage Improvements**:

- ✅ SDF library tests - Core parsing functionality (most critical)
- ✅ Compound loader tests - Main data import pathway
- ✅ Batch loader tests - Batch data loading functionality
- ✅ Molecules controller tests - Custom endpoint coverage

### Current Status: Phase 4 COMPLETED ✅

**Total Test Coverage Improvement**:

- **Before Phase 4**: 37 runs, 65 assertions
- **After Phase 4**: 60 runs, 176 assertions
- **Increase**: +23 runs (+62%), +111 assertions (+171%)

### Phase 3: Controller Tests - ✅ COMPLETED

**Status**: Already completed as part of Phase 4 work. The molecules controller test was created with 5 comprehensive tests covering the `molecule_exists` endpoint. No additional controller tests required as all routes are covered.

### Phase 2: Model Tests Enhancement - ✅ COMPLETED

**Implementation Date**: 2026-02-16

**Files Enhanced**:

1. `test/models/grit/compounds/molecule_test.rb` - Enhanced from 0 to 10 tests
2. `test/models/grit/compounds/compound_test.rb` - Enhanced from 2 to 22 tests
3. `test/models/grit/compounds/batch_test.rb` - Enhanced from 2 to 13 tests

**Test Results**:

- **41 new test runs** added (10 + 20 + 11)
- **92 new assertions** added
- **0 failures, 0 errors, 0 skips**
- **100% pass rate**

**Coverage Improvements**:

- ✅ Molecule model - `by_molfile`, `by_smiles`, `molfile_from_smiles`, `set_molid` callback, associations
- ✅ Compound model - associations, `no_synonyms_with_name` validation, `Compound.create`, `set_number` callback, `find_by_name_or_synonyms`, `loader_find_by`, `detailed` scope, `entity_fields`, `entity_columns`
- ✅ Batch model - associations, `Batch.create`, `set_number` callback, `detailed` scope, `entity_fields`, `entity_columns`, `compound_type_properties`

### Current Status: Phase 2 & 3 COMPLETED ✅

**Total Test Coverage Improvement**:

- **Before Phase 2**: 60 runs, 176 assertions
- **After Phase 2**: 101 runs, 268 assertions
- **Increase**: +41 runs (+68%), +92 assertions (+52%)

**Overall Progress (from initial state)**:

- **Initial**: 37 runs, 65 assertions
- **Current**: 101 runs, 268 assertions
- **Total Increase**: +64 runs (+173%), +203 assertions (+312%)

### Phase 5: Integration Tests - COMPLETED

**Implementation Date**: 2026-02-16

**Files Created**:

1. `test/integration/compound_loading_test.rb` - 6 comprehensive end-to-end tests
2. `test/integration/batch_loading_test.rb` - 4 comprehensive end-to-end tests
3. `test/fixtures/grit/core/load_sets.yml` - LoadSet fixtures for integration tests
4. `test/fixtures/grit/core/load_set_blocks.yml` - LoadSetBlock fixtures for integration tests
5. `test/fixtures/grit/compounds/compound_load_set_blocks.yml` - Compound-specific block fixtures
6. `test/fixtures/grit/compounds/batch_load_set_blocks.yml` - Batch-specific block fixtures
7. `test/fixtures/files/simple_integration.sdf` - Additional SDF file for integration tests

**Test Results**:

- **10 new integration test runs** added
- **103 new assertions** added
- **0 failures, 0 errors, 0 skips**
- **100% pass rate**

**Coverage Improvements**:

- Full SDF compound loading workflow (create -> initialize -> validate -> confirm)
- Multiple molecules SDF loading
- Existing molecule linking (deduplication with warnings)
- Invalid molfile structure validation error handling
- Compound/molecule rollback functionality
- API response JSON structure verification
- Full CSV batch loading workflow
- Invalid compound reference validation
- Batch rollback functionality
- Batch API response structure verification

**Key Implementation Notes**:

- Used `self.use_transactional_tests = false` to avoid PostgreSQL transaction conflicts
- Mappings require `origin_id` with constant value for proper entity creation
- Entity lookups use `find_by` parameter (e.g., `"compound_id" => { "header" => "col_1", "find_by" => "number" }`)
- Molecule column is `col_0` (molfile), name/SMILES is `col_1` in SDF files

### Current Status: Phase 5 COMPLETED

**Total Test Coverage Improvement**:

- **Before Phase 5**: 101 runs, 268 assertions
- **After Phase 5**: 111 runs, 371 assertions
- **Increase**: +10 runs (+10%), +103 assertions (+38%)

**Overall Progress (from initial state)**:

- **Initial**: 37 runs, 65 assertions
- **Current**: 111 runs, 371 assertions
- **Total Increase**: +74 runs (+200%), +306 assertions (+471%)

### Next Steps: Ready for Phase 6 Implementation

Proceed to remaining phase:

1. Phase 6: Test Quality Improvements - Helper methods and factories (optional)

---

## Phase 7: Quality Review and Improvements

**Review Date**: 2026-02-16

### Quality Assessment Summary

After reviewing all implemented tests, the following improvement opportunities were identified:

#### Completed Fixes

1. **Bug Fix: Assertion Typo in molecules_controller_test.rb:21** - FIXED
   - Issue: Used `=` (assignment) instead of `==` (comparison) in assertion
   - Changed: `assert response_body["data"]["molfile"] = @valid_molfile`
   - To: `assert_equal @valid_molfile, response_body["data"]["molfile"]`

### Remaining Improvement Opportunities

#### High Priority

None remaining after bug fix.

#### Medium Priority

##### Task 7.1: Add Direct Unit Tests for CompoundLoader Methods

**File**: `test/lib/grit/compounds/compound_loader_test.rb`

**Current state**: 4 tests covering `block_fields`, `block_set_data_fields`, and SDF parsing integration

**Tests to add**:

1. `test "validate_record should add warning for existing molecule"` - Verify molecule deduplication warnings
2. `test "validate_record should add error for invalid molfile structure"` - Verify structure validation
3. `test "validate_record should validate compound property values"` - Test property value validation
4. `test "confirm_block should create LoadSetBlockLoadedRecord entries"` - Verify audit trail creation
5. `test "rollback_block should delete all created records"` - Unit test rollback logic
6. `test "block_mapping_fields should exclude auto-generated fields"` - Verify excluded fields
7. `test "block_loading_fields should convert mol type to text"` - Verify type conversion
8. `test "set_block_data should update load set block and compound block"` - Test data update logic

**Estimated effort**: 3-4 hours

##### Task 7.2: Add Direct Unit Tests for BatchLoader Methods

**File**: `test/lib/grit/compounds/batch_loader_test.rb`

**Current state**: 4 tests covering `block_fields`, `block_set_data_fields`, and entity_fields

**Tests to add**:

1. `test "validate_record should validate batch property values"` - Test property validation errors
2. `test "confirm_block should create LoadSetBlockLoadedRecord entries"` - Verify audit trail
3. `test "rollback_block should delete batch and property value records"` - Unit test rollback
4. `test "block_mapping_fields should exclude auto-generated fields"` - Verify excluded fields

**Estimated effort**: 2-3 hours

##### Task 7.3: Verify Property Value Creation in Integration Tests

**Files**:

- `test/integration/compound_loading_test.rb`
- `test/integration/batch_loading_test.rb`

**Enhancement**:

- After confirm, verify `CompoundPropertyValue` / `BatchPropertyValue` records were created
- Verify the values match the input data
- Verify correct `compound_property_id` / `batch_property_id` associations

**Estimated effort**: 1-2 hours

##### Task 7.4: Add Negative Tests for Loaders

**Tests to add**:

1. `test "loading with invalid compound_type_id raises error"` - Test error handling
2. `test "partial transaction failure rolls back all changes"` - Test atomicity

**Estimated effort**: 1-2 hours

#### Low Priority

##### Task 7.5: Add Test for columns_from_file CSV Branch

**File**: `test/lib/grit/compounds/compound_loader_test.rb`

**Test to add**:

- `test "columns_from_file should use CSV parser when structure_format is not molfile"`

**Estimated effort**: 30 minutes

##### Task 7.6: Add Performance Test for Large SDF Files

**File**: `test/lib/grit/compounds/sdf_test.rb` or `test/integration/compound_loading_test.rb`

**Test to add**:

- `test "should handle SDF file with 100+ molecules efficiently"`

**Estimated effort**: 1 hour

### Implementation Priority Order

1. ~~Bug fix (Task 7.0)~~ - COMPLETED
2. Task 7.1 - CompoundLoader unit tests (most value, covers complex logic)
3. Task 7.3 - Property value verification (validates business logic)
4. Task 7.2 - BatchLoader unit tests (similar pattern to 7.1)
5. Task 7.4 - Negative tests (error handling confidence)
6. Task 7.5 - CSV branch coverage
7. Task 7.6 - Performance test

### Estimated Total Effort

- **Remaining Tasks**: 8-12 hours
- **Current Coverage**: 111 runs, 371 assertions
- **Expected After Phase 7**: ~130 runs, ~450 assertions

### Quality Metrics After Phase 7 (Projected)

| Component              | Current Tests | After Phase 7 |
| ---------------------- | ------------- | ------------- |
| SDF Library            | 10            | 11            |
| CompoundLoader         | 4             | 12            |
| BatchLoader            | 4             | 8             |
| MoleculesController    | 5             | 5             |
| Molecule Model         | 10            | 10            |
| Compound Model         | 22            | 22            |
| Batch Model            | 13            | 13            |
| Integration (Compound) | 6             | 8             |
| Integration (Batch)    | 4             | 5             |
