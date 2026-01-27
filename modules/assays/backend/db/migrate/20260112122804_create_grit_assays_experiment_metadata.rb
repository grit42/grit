class CreateGritAssaysExperimentMetadata < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_experiment_metadata, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.references :experiment, null: false, foreign_key: { name: "assays_experiment_metadata_assays_experiment_id_fkey", to_table: "grit_assays_experiments" }
      t.references :assay_metadata_definition, null: false, foreign_key: { name: "assays_experiment_metadata_assays_assay_metadata_definition_id_fkey", to_table: "grit_assays_assay_metadata_definitions" }
      t.references :vocabulary, null: false, foreign_key: { name: "assays_experiment_metadata_core_vocabulary_id_fkey", to_table: "grit_core_vocabularies" }
      t.references :vocabulary_item, null: false, foreign_key: { name: "assays_experiment_metadata_assays_core_item_id_fkey", to_table: "grit_core_vocabulary_items" }
      t.index [ :experiment_id, :assay_metadata_definition_id ], unique: true, name: "uniq_metadata_definition_per_experiment"
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_experiment_metadata BEFORE INSERT OR UPDATE ON public.grit_assays_experiment_metadata FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_experiment_metadata

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_experiment_metadata ON public.grit_assays_experiment_metadata;"
  end
end
