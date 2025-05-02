class CreateGritAssaysExperimentDataSheetRecords < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_experiment_data_sheet_records, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.references :experiment_data_sheet, null: false, foreign_key: { name: "assays_experiment_data_sheet_records_assays_experiment_data_sheet_id_fkey", to_table: "grit_assays_experiment_data_sheets" }, index: true
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_experiment_data_sheet_records BEFORE INSERT OR UPDATE ON public.grit_assays_experiment_data_sheet_records FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_experiment_data_sheet_records

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_experiment_data_sheet_records ON public.grit_assays_experiment_data_sheet_records;"
  end
end
