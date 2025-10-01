# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2025-10-01

Data tables

### Added
- (assays) data tables
- (core) token authentication in query parameters

### Changed
- (core) `detailed` scope sorted by default if the entity has a `sort` column
- (core) improved UX of login, account recovery and two factor views

### Fixed
- (assays) plots tab crashing if the assay model does not define sheets
- (table) rows grow to the tallest cell
- (compounds) handle DataWarrior SDF exports with a less strict SDF parser


## [0.6.0] - 2025-08-04

Vocabularies as data types

### Added
- (core) top level section for managing vocabularies
- (core) data types for vocabularies

### Changed
- vocabularies have been moved from assays module to core module

### Fixed
- (assays) always refresh columns when navigating to a data sheet

## [0.5.0] - 2025-06-02

Improved data upload flow

### Added
- (core) data set preview before initiating the import
- (core) improved manual/pasted data set input
- (core) capability to edit or replace the data set at the mapping stage
- (core) capability to ignore errors and confirm import at the mapping stage
- (core) display and export of rows containing errors after validation
- (core) mapped properties' name in the data set table headers
- (core/compounds) data set delimiter (and compound structure format) in the
client
- (core) extensible importer API endpoints for retrieval of the data set,
successfully loaded data columns and load set creation form fields
- (core) extensible importer API endpoints for retrieval of the data set,
successfully loaded data columns and load set creation form fields
- (core) listener for updating load set creation form on data set changes
- (core) extensible loaded data viewer actions

### Changed
- (core) entity fields show only unique properties as find by options
- (core) refactor the frontend importer extension API

### Fixed
- (core) fix properties form overflowing quirk at the mapping stage

