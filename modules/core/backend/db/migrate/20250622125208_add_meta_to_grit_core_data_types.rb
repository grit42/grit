class AddMetaToGritCoreDataTypes < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_core_data_types, :meta, :jsonb, default: {}
  end
end
