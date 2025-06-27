class PrepareSwitchToCoreVocabularies < ActiveRecord::Migration[7.2]
  def up
    remove_index :grit_assays_vocabulary_items, name: "uniq_vocabulary_item_name_per_vocabulary"
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
