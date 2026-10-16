# `committed_at`, which SchemaDefinition includers need (nil while a draft).
class AddCommitStateToTestSchemaDefinitions < ActiveRecord::Migration[8.1]
  def change
    add_column :test_schema_definitions, :committed_at, :datetime
  end
end
