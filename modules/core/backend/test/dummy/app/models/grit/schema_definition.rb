# Dummy host for Grit::Core::Model::DynamicSchema::SchemaDefinition.
#
# Deliberately minimal: it includes the concern under test and nothing else (no
# GritEntityRecord), so specs exercise the concern rather than the surrounding
# entity machinery, and so these models stay out of EntityMapper's entity list.
#
# The association is given its *natural* name, `table_definitions`, which is
# also the name of the concern's own accessor. That is the arrangement that used
# to recurse infinitely, so it pins the fix in place.
class Grit::SchemaDefinition < ApplicationRecord
  self.table_name = "test_schema_definitions"

  include Grit::Core::Model::DynamicSchema::SchemaDefinition

  dynamic_schema_prefix "test"

  has_many_table_definitions :table_definitions
end
