class CreateGritAssaysAssayMetadataDefinitions < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_assay_metadata_definitions, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false, index: { unique: true }
      t.string :safe_name, null: false, index: { unique: true }, limit: 30
      t.text :description

      t.references :vocabulary, null: false, foreign_key: { name: "assays_assay_metadata_definitions_assays_vocabulary_id_fkey", to_table: "grit_assays_vocabularies" }
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_assay_metadata_definitions BEFORE INSERT OR UPDATE ON public.grit_assays_assay_metadata_definitions FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_assay_metadata_definitions

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_assay_metadata_definitions ON public.grit_assays_assay_metadata_definitions;"
  end
end
