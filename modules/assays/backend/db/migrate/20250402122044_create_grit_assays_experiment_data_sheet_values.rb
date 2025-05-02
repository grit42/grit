class CreateGritAssaysExperimentDataSheetValues < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_experiment_data_sheet_values, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.string :numeric_sign, null: true, default: nil
      t.string :string_value, null: true, default: nil
      t.integer :integer_value, null: true, default: nil
      t.decimal :decimal_value, null: true, default: nil
      t.float :float_value, null: true, default: nil
      t.text :text_value, null: true, default: nil
      t.datetime :datetime_value, null: true, default: nil
      t.date :date_value, null: true, default: nil
      t.boolean :boolean_value, null: true, default: nil
      t.bigint :entity_id_value, null: true, default: nil

      t.references :experiment_data_sheet_record, null: false, foreign_key: { name: "assays_experiment_data_sheet_values_assays_experiment_data_sheet_record_id_fkey", to_table: "grit_assays_experiment_data_sheet_records" }, index: true
      t.references :assay_data_sheet_column, null: false, foreign_key: { name: "assays_experiment_data_sheet_values_assays_assay_data_sheet_column_id_fkey", to_table: "grit_assays_assay_data_sheet_columns" }, index: true
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_experiment_data_sheet_values BEFORE INSERT OR UPDATE ON public.grit_assays_experiment_data_sheet_values FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_experiment_data_sheet_values

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_experiment_data_sheet_values ON public.grit_assays_experiment_data_sheet_values;"
  end
end
