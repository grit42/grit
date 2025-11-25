class CheckSafenameLengthBeforeMigration < ActiveRecord::Migration[7.2]
  def up
    limit = 30
    
    data_sheet_column_exceeding_limit = Grit::Assays::AssayDataSheetColumn.where("LENGTH(safe_name) > ?", limit)
    data_table_column_exceeding_limit = Grit::Assays::DataTableColumn.where("LENGTH(safe_name) > ?", limit)    

    if data_sheet_column_exceeding_limit.any?
      puts "WARNING: The following records in 'grit_assays_assay_data_sheet_columns' have 'safe_name' exceeding #{limit} characters:"
      data_sheet_column_exceeding_limit.each do |record|
        puts "  Record ID: #{record.id}, Current Length: #{record.safe_name.length}"
      end
    end
    if data_table_column_exceeding_limit.any?
      puts "WARNING: The following records in 'grit_assays_data_table_columns' have 'safe_name' exceeding #{limit} characters:"
      data_table_column_exceeding_limit.each do |record|
        puts "  Record ID: #{record.id}, Current Length: #{record.safe_name.length}"
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
