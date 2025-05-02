class ChangeAssayDataSheetDefinitionResultNull < ActiveRecord::Migration[7.2]
  def change
    change_column_null(:grit_assays_assay_data_sheet_definitions, :result, true)
  end
end
