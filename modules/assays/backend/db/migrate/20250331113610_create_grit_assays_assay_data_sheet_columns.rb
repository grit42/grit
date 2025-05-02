class CreateGritAssaysAssayDataSheetColumns < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_assay_data_sheet_columns, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.string :name, null: false
      t.string :safe_name, null: false
      t.text :description
      t.integer :sort
      t.boolean :required, null: false, default: false

      t.references :assay_data_sheet_definition, null: false, foreign_key: { name: "assays_assay_data_sheet_columns_assays_assay_data_sheet_definition", to_table: "grit_assays_assay_data_sheet_definitions" }
      t.references :data_type, null: false, foreign_key: { name: "assays_assay_data_sheet_columns_core_data_types_fkey", to_table: "grit_core_data_types" }
      t.references :unit, null: true, foreign_key: { name: "assays_assay_data_sheet_columns_core_units_fkey", to_table: "grit_core_units" }, index: false
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_assay_data_sheet_columns BEFORE INSERT OR UPDATE ON public.grit_assays_assay_data_sheet_columns FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_assay_data_sheet_columns

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_assay_data_sheet_columns ON public.grit_assays_assay_data_sheet_columns;"
  end
end
