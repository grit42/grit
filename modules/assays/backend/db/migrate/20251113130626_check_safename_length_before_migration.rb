class CheckSafenameLengthBeforeMigration < ActiveRecord::Migration[7.2]
  def up
    limit = 30
    
    data_sheet_column_exceeding_limit = Grit::Assays::AssayDataSheetColumn.where("LENGTH(safe_name) > ?", limit)
    data_table_column_exceeding_limit = Grit::Assays::DataTableColumn.where("LENGTH(safe_name) > ?", limit)    

    if data_sheet_column_exceeding_limit.any?
      puts "WARNING: The following DataSheetColumn records have 'safe_name' exceeding #{limit} characters:"
      data_sheet_column_exceeding_limit.each do |record|
        data_sheet = Grit::Assays::AssayDataSheetDefinition.find(record.assay_data_sheet_definition_id)
        model = Grit::Assays::AssayModel.find(data_sheet.assay_model_id)
        puts "  Model: #{model.name}, Sheet: #{data_sheet.name}, Column safe_name: #{record.safe_name}, Current Length: #{record.safe_name.length}"
      end
    end
    if data_table_column_exceeding_limit.any?
      puts "WARNING: The following DataTableColumn records have 'safe_name' exceeding #{limit} characters:"
      data_table_column_exceeding_limit.each do |record|
        data_table = Grit::Assays::DataTable.find(record.data_table_id)
        puts "  Data table: #{data_table.name}, Column safe_name: #{record.safe_name}, Current Length: #{record.safe_name.length}"
      end
    end
    if data_sheet_column_exceeding_limit.any? or data_table_column_exceeding_limit.any?
      raise "Migration aborted: Records found exceeding the new column limit." 
    end
  end

  def down
    # No action needed for down migration of a check
  end
end
