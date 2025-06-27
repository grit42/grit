class SwitchToCoreVocabularies < ActiveRecord::Migration[7.2]
  def up
    execute "INSERT INTO grit_core_vocabularies SELECT id,created_by,created_at,updated_by,updated_at,name,description FROM grit_assays_vocabularies;"
    execute "INSERT INTO grit_core_vocabulary_items SELECT id,created_by,created_at,updated_by,updated_at,name,description,vocabulary_id FROM grit_assays_vocabulary_items;"

    remove_foreign_key :grit_assays_assay_metadata_definitions, column: :vocabulary_id
    add_foreign_key :grit_assays_assay_metadata_definitions, :grit_core_vocabularies, column: :vocabulary_id, name: "assays_assay_metadata_definitions_core_vocabulary_id_fkey"

    remove_foreign_key :grit_assays_assay_metadata, column: :vocabulary_id
    remove_foreign_key :grit_assays_assay_metadata, column: :vocabulary_item_id
    add_foreign_key :grit_assays_assay_metadata, :grit_core_vocabularies, column: :vocabulary_id, name: "assays_assay_metadata_core_vocabulary_id_fkey"
    add_foreign_key :grit_assays_assay_metadata, :grit_core_vocabulary_items, column: :vocabulary_item_id, name: "assays_assay_metadata_core_vocabulary_item_id_fkey"

    drop_table :grit_assays_vocabulary_items
    drop_table :grit_assays_vocabularies

    Grit::Core::Vocabulary.all.each do |vocabulary|
      Grit::Core::DataType.insert({
        is_entity: true,
        name: vocabulary.name,
        description: vocabulary.description,
        table_name: Grit::Core::VocabularyItem.table_name,
        meta: {
          vocabulary_id: vocabulary.id
        }
      })
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
