class LimitDataSheetColumnSafename < ActiveRecord::Migration[7.2]
  def up
    change_column :grit_assays_data_table_columns, :safe_name, :string, limit: 30
  end
  def down
    change_column :grit_assays_data_table_columns, :safe_name, :string, limit: 32
  end
end
