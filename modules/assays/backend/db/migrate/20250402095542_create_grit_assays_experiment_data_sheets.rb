class CreateGritAssaysExperimentDataSheets < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_experiment_data_sheets, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.references :experiment, null: false, foreign_key: { name: "assays_experiment_data_sheets_assays_experiment_id_fkey", to_table: "grit_assays_experiments" }
      t.references :assay_data_sheet_definition, null: false, foreign_key: { name: "assays_experiment_data_sheets_assays_assay_data_sheet_definition_id_fkey", to_table: "grit_assays_assay_data_sheet_definitions" }
      t.index [ :assay_data_sheet_definition_id, :experiment_id ], unique: true, name: "uniq_data_sheet_definition_per_experiment"
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_experiment_data_sheets BEFORE INSERT OR UPDATE ON public.grit_assays_experiment_data_sheets FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_experiment_data_sheets

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_experiment_data_sheets ON public.grit_assays_experiment_data_sheets;"
  end
end
