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

### Phase 1: Setup and Preparation

**Objective**: Create necessary test infrastructure and fixtures

#### Task 1.1: Create Test Fixtures for Molecules

- **File**: `test/fixtures/grit/compounds/molecules.yml`
- **Content**: Sample molecule records with molfile data
- **Dependencies**: Existing compound fixtures

#### Task 1.2: Create Test Fixtures for MoleculesCompounds (join table)

- **File**: `test/fixtures/grit/compounds/molecules_compounds.yml`
- **Content**: Associations between molecules and compounds
- **Dependencies**: molecules.yml, compounds.yml

#### Task 1.3: Create Sample SDF Files for Testing

- **Directory**: `test/fixtures/files/`
- **Files**:
  - `simple.sdf` - Basic SDF with one molecule
  - `multiple.sdf` - SDF with multiple molecules
  - `malformed.sdf` - Invalid SDF for error testing
  - `with_properties.sdf` - SDF with custom properties

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

- **Phase 1 (Setup)**: 2-4 hours
- **Phase 2 (Model Tests)**: 4-6 hours
- **Phase 3 (Controller Tests)**: 2-3 hours
- **Phase 4 (Library Tests)**: 8-12 hours (most complex)
- **Phase 5 (Integration Tests)**: 4-6 hours
- **Phase 6 (Quality)**: 2-3 hours

**Total Estimated**: 22-34 hours

## Testing Strategy

### Test Data Approach

- Use fixtures for basic test data
- Create helper methods for dynamic test data generation
- Use factory pattern for complex object creation
- Store sample files in `test/fixtures/files/` directory

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

✅ All new test files created and passing
✅ Test coverage increased from ~65 assertions to 200+ assertions  
✅ All critical components (loaders, SDF, molecules) have test coverage
✅ Integration tests verify end-to-end workflows
✅ No regression in existing tests
✅ Test suite runs in < 30 seconds

## Next Steps

This plan is ready for execution. The recommended approach is to:

1. Start with Phase 1 (Setup) to create necessary infrastructure
2. Proceed to Phase 4 (Library Tests) as this is the most critical missing coverage
3. Continue with Phase 3 (Controller Tests) and Phase 2 (Model Tests)
4. Finish with Phase 5 (Integration Tests) and Phase 6 (Quality)

Each phase can be executed in separate sessions, with progress tracked in this document.
