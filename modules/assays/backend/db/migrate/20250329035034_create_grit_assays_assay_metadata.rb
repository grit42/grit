class CreateGritAssaysAssayMetadata < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_assay_metadata, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.references :assay, null: false, foreign_key: { name: "assays_assay_metadata_assays_assay_id_fkey", to_table: "grit_assays_assays" }
      t.references :assay_model_metadatum, null: false, foreign_key: { name: "assays_assay_metadata_assays_assay_model_metadatum_id_fkey", to_table: "grit_assays_assay_model_metadata" }
      t.references :vocabulary, null: false, foreign_key: { name: "assays_assay_metadata_assays_vocabulary_id_fkey", to_table: "grit_assays_vocabularies" }
      t.references :vocabulary_item, null: false, foreign_key: { name: "assays_assay_metadata_assays_vocabulary_item_id_fkey", to_table: "grit_assays_vocabulary_items" }
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_assay_metadata BEFORE INSERT OR UPDATE ON public.grit_assays_assay_metadata FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_assay_metadata

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_assay_metadata ON public.grit_assays_assay_metadata;"
  end
end
