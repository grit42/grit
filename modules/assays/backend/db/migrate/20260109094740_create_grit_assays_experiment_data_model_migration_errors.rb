class CreateGritAssaysExperimentDataModelMigrationErrors < ActiveRecord::Migration[7.2]
  def change
    create_table :grit_assays_experiment_data_model_migration_errors, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.references :experiment_data_sheet_value, null: false, foreign_key: { to_table: "grit_assays_experiment_data_sheet_values"}
      t.references :experiment_data_sheet_record, null: false, foreign_key: { to_table: "grit_assays_experiment_data_sheet_records"}
      t.references :experiment_data_sheet, null: false, foreign_key: { to_table: "grit_assays_experiment_data_sheets"}
      t.references :experiment, null: false, foreign_key: { to_table: "grit_assays_experiments"}
      t.references :assay_data_sheet_definition, null: false, foreign_key: { to_table: "grit_assays_assay_data_sheet_definitions"}
      t.references :assay_data_sheet_column, null: false, foreign_key: { to_table: "grit_assays_assay_data_sheet_columns"}
      t.jsonb :migration_errors
    end
  end
end
