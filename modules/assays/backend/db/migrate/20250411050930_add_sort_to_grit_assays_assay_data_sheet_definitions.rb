class AddSortToGritAssaysAssayDataSheetDefinitions < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_assays_assay_data_sheet_definitions, :sort, :integer
  end
end
