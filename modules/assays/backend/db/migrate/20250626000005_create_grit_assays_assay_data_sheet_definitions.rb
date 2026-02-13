class CreateGritAssaysAssayDataSheetDefinitions < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_assay_data_sheet_definitions, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false, index: true
      t.text :description

      t.boolean :result, default: false, comment: "Make this data available in Data Tables"
      t.integer :sort

      t.references :assay_model, null: false, foreign_key: { name: "assays_assay_data_sheet_definitions_assays_assay_model_id_fkey", to_table: "grit_assays_assay_models" }
      t.index [ :name, :assay_model_id ], unique: true, name: "uniq_assay_data_sheet_definition_name_per_assay_model"
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_assay_data_sheet_definitions BEFORE INSERT OR UPDATE ON public.grit_assays_assay_data_sheet_definitions FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_assay_data_sheet_definitions

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_assay_data_sheet_definitions ON public.grit_assays_assay_data_sheet_definitions;"
  end
end
