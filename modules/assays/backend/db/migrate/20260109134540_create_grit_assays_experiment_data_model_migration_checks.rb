class CreateGritAssaysExperimentDataModelMigrationChecks < ActiveRecord::Migration[7.2]
  def change
    create_table :grit_assays_experiment_data_model_migration_checks, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.bigint :error_count
      t.string :status
    end
  end
end
