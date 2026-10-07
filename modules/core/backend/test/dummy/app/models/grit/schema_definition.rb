# Minimal dummy host for Grit::Core::Model::DynamicSchema::SchemaDefinition (no
# GritEntityRecord, so it stays out of EntityMapper). Associations use the same
# names as the concern's accessors, to pin that this doesn't recurse.
class Grit::SchemaDefinition < ApplicationRecord
  self.table_name = "test_schema_definitions"

  include Grit::Core::Model::DynamicSchema::SchemaDefinition

  dynamic_schema_prefix "test"

  has_many_table_definitions :table_definitions
end
