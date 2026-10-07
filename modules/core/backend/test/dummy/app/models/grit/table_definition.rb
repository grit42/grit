# Minimal dummy host for Grit::Core::Model::DynamicSchema::TableDefinition (no
# GritEntityRecord, so it stays out of EntityMapper). Associations use the same
# names as the concern's accessors, to pin that this doesn't recurse.
class Grit::TableDefinition < ApplicationRecord
  self.table_name = "test_table_definitions"

  include Grit::Core::Model::DynamicSchema::TableDefinition

  has_many_column_definitions :column_definitions
  belongs_to_schema_definition :schema_definition

  # Exercises the implementation-column hook: a column every dynamic table gets
  # whether or not anyone defined it, carrying a foreign key.
  def implementation_column_definitions
    [
      {
        identifier: "owner_id",
        data_type_name: "bigint",
        required: false,
        foreign_key: { table_name: "grit_core_users" }
      }
    ]
  end
end
