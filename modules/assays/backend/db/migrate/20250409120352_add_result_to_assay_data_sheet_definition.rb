class AddResultToAssayDataSheetDefinition < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_assays_assay_data_sheet_definitions, :result, :boolean, null: false, default: false, comment: "Make this data available in Data Tables"
  end
end
