class CreateGritCoreVocabularyItems < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_core_vocabulary_items, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false, index: true
      t.text :description

      t.references :vocabulary, null: false, foreign_key: { name: "core_vocabulary_items_core_vocabulary_id_fkey", to_table: "grit_core_vocabularies" }
      t.index [ :name, :vocabulary_id ], unique: true, name: "uniq_vocabulary_item_name_per_vocabulary"
    end

    execute "CREATE TRIGGER manage_stamps_grit_core_vocabulary_items BEFORE INSERT OR UPDATE ON public.grit_core_vocabulary_items FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_core_vocabulary_items

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_core_vocabulary_items ON public.grit_core_vocabulary_items;"
  end
end
