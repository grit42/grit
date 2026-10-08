# Minimal dummy host for Grit::Core::Model::DynamicSchema::ColumnDefinition (no
# GritEntityRecord, so it stays out of EntityMapper). Associations use the same
# names as the concern's accessors, to pin that this doesn't recurse.
class Grit::ColumnDefinition < ApplicationRecord
  self.table_name = "test_column_definitions"

  include Grit::Core::Model::DynamicSchema::ColumnDefinition

  belongs_to_table_definition :table_definition
end
