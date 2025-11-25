class LimitDataSheetColumnSafename < ActiveRecord::Migration[7.2]
  def up
    change_column :grit_assays_assay_data_sheet_columns, :safe_name, :string, limit: 30
  end
  def down
    change_column :grit_assays_assay_data_sheet_columns, :safe_name, :string, limit: nil
  end
end
