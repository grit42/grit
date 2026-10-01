# Backing tables for the dummy models that exercise the
# Grit::Core::Model::DynamicSchema concerns (Grit::SchemaDefinition,
# Grit::TableDefinition, Grit::ColumnDefinition). Mirrors the column layout the
# concerns expect from an includer: the grit base column quartet plus
# `identifier` / `name` / `sort`, and foreign keys between the three levels.
class CreateTestTableDefinitions < ActiveRecord::Migration[8.1]
  def change
    create_table :test_schema_definitions, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { "nextval('grit_seq'::regclass)" }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :identifier, null: false
      t.string :name
      t.integer :sort
      t.index :identifier, unique: true, name: "test_schema_definitions_identifier"
    end

    create_table :test_table_definitions, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { "nextval('grit_seq'::regclass)" }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :identifier, null: false
      t.string :name
      t.integer :sort
      t.bigint :schema_definition_id, null: false, index: true
      t.index [ :schema_definition_id, :identifier ], unique: true,
        name: "test_table_definitions_schema_definition_id_identifier"
    end

    create_table :test_column_definitions, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { "nextval('grit_seq'::regclass)" }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :identifier, null: false
      t.string :name
      t.string :description
      t.integer :sort
      t.boolean :required, null: false, default: false
      t.bigint :table_definition_id, null: false, index: true
      t.bigint :data_type_id, null: false, index: true
      t.index [ :table_definition_id, :identifier ], unique: true,
        name: "test_column_definitions_table_definition_id_identifier"
    end

    add_foreign_key :test_table_definitions, :test_schema_definitions,
      column: :schema_definition_id, name: "test_table_definitions_schema_definition_id"
    add_foreign_key :test_column_definitions, :test_table_definitions,
      column: :table_definition_id, name: "test_column_definitions_table_definition_id"
    add_foreign_key :test_column_definitions, :grit_core_data_types,
      column: :data_type_id, name: "test_column_definitions_data_type_id"
  end
end
