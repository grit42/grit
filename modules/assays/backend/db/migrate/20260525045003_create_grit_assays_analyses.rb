class CreateGritAssaysAnalyses < ActiveRecord::Migration[8.1]
  def up
    create_table :grit_assays_analyses, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false, index: { unique: true }
      t.text :description
      t.jsonb :filters, default: {}
      t.jsonb :plots, default: {}
      t.references :assay_data_sheet_definition, null: false, foreign_key: { name: "analysis_assay_data_sheet_definition", to_table: "grit_assays_assay_data_sheet_definitions" }
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_analyses BEFORE INSERT OR UPDATE ON public.grit_assays_analyses FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_analyses

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_analyses ON public.grit_assays_analyses;"
  end
end
