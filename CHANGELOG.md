# Changelog

## v0.5.0 - Improved data upload flow

- (core) add data set preview before initiating the import
- (core) add improved manual/pasted data set input
- (core) add capability to edit or replace the data set in the mapping stage
- (core) add capability to ignore errors and confirm import in the mapping stage
- (core) add display and export of rows containing errors after validation
- (core) add mapped properties' name in the data set table headers
- (core/compounds) add data set delimiter (and compound structure format) in the
client
- (core) change entity fields to show only unique properties as find by options
- (core) change importer API
    - add extensible API endpoints for retrieval of the data set,
    successfully loaded data columns and load set creation form fields
    - refactor the frontend extension API, add listener for data set update and
    loaded data viewer actions
- (core) fix mapping options overflowing
