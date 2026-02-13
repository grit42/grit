class CreateGritAssaysAssayModelMetadata < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_assay_model_metadata, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.references :assay_model, null: false, foreign_key: { name: "assays_assay_model_metadata_assays_assay_model_id_fkey", to_table: "grit_assays_assay_models" }
      t.references :assay_metadata_definition, null: false, foreign_key: { name: "assays_assay_model_metadata_assays_assay_metadata_definition_id_fkey", to_table: "grit_assays_assay_metadata_definitions" }
      t.index [ :assay_metadata_definition_id, :assay_model_id ], unique: true, name: "uniq_assay_model_metadata_definition_per_assay_model"
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_assay_model_metadata BEFORE INSERT OR UPDATE ON public.grit_assays_assay_model_metadata FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_assay_model_metadata

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_assay_model_metadata ON public.grit_assays_assay_model_metadata;"
  end
end
