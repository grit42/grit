class AddDescriptionToGritCoreDataTypes < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_core_data_types, :description, :text
    add_index :grit_core_data_types, :name, unique: true, if_not_exists: true
  end
end
