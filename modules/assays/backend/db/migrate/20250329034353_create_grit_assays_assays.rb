class CreateGritAssaysAssays < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_assays, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false, index: { unique: true }
      t.text :description

      t.references :assay_model, null: false, foreign_key: { name: "assays_assays_assays_model_id_fkey", to_table: "grit_assays_assay_models" }
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_assays BEFORE INSERT OR UPDATE ON public.grit_assays_assays FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_assays

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_assays ON public.grit_assays_assays;"
  end
end
