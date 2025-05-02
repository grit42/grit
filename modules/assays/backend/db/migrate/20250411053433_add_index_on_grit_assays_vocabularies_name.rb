class AddIndexOnGritAssaysVocabulariesName < ActiveRecord::Migration[7.2]
  def change
    remove_index :grit_assays_vocabularies, :name
    add_index :grit_assays_vocabularies, :name, unique: true
  end
end
