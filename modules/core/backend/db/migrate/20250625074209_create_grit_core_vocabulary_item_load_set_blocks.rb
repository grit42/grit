class CreateGritCoreVocabularyItemLoadSetBlocks < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_core_vocabulary_item_load_set_blocks, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.references :load_set_block, foreign_key: { name: "core_vocabulary_item_load_set_blocks_core_load_set_block_id_fkey", to_table: "grit_core_load_set_blocks" }, null: false
      t.references :vocabulary, foreign_key: { name: "core_vocabulary_item_load_set_blocks_core_vocabularies_fkey", to_table: "grit_core_vocabularies" }, null: false
    end

    execute "CREATE TRIGGER manage_stamps_grit_core_vocabulary_item_load_set_blocks BEFORE INSERT OR UPDATE ON public.grit_core_vocabulary_item_load_set_blocks FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_core_vocabulary_item_load_set_blocks

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_core_vocabulary_item_load_set_blocks ON public.grit_core_vocabulary_item_load_set_blocks;"
  end
end
