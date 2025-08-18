class CreateGritAssaysDataTableColumns < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_data_table_columns, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.references :data_table, null: false, foreign_key: { name: "assays_data_table_entities_assays_data_table_id_fkey", to_table: "grit_assays_data_tables" }
      t.references :data_sheet_column, null: false, foreign_key: { name: "assays_data_table_entities_assays_assay_data_sheet_column_id_fkey", to_table: "grit_assays_assay_data_sheet_columns" }
      t.jsonb :meta, default: {}
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_data_table_columns BEFORE INSERT OR UPDATE ON public.grit_assays_data_table_columns FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_data_table_columns

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_data_table_columns ON public.grit_assays_data_table_columns;"
  end
end
