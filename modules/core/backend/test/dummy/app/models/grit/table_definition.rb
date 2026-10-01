# Dummy host for Grit::Core::Model::DynamicSchema::TableDefinition.
#
# Deliberately minimal: it includes the concern under test and nothing else (no
# GritEntityRecord), so specs exercise the concern rather than the surrounding
# entity machinery, and so these models stay out of EntityMapper's entity list.
#
# Both associations are given their *natural* names, `column_definitions` and
# `schema_definition`, which are also the names of the concern's own accessors.
# That is the arrangement that used to recurse infinitely, so it pins the fix in
# place.
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
