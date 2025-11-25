class CheckSafenameLengthBeforeMigration < ActiveRecord::Migration[7.2]
  def up
    limit = 30
    
    compound_properties_exceeding_limit = Grit::Compounds::CompoundProperty.where("LENGTH(safe_name) > ?", limit)
    batch_properties_exceeding_limit = Grit::Compounds::BatchProperty.where("LENGTH(safe_name) > ?", limit)    

    if compound_properties_exceeding_limit.any?
      puts "WARNING: The following records in 'grit_compounds_compound_properties' have 'safe_name' exceeding #{limit} characters:"
      compound_properties_exceeding_limit.each do |record|
        puts "  Record ID: #{record.id}, Current Length: #{record.safe_name.length}"
      end
    end
    if batch_properties_exceeding_limit.any?
      puts "WARNING: The following records in 'grit_compounds_batch_properties' have 'safe_name' exceeding #{limit} characters:"
      batch_properties_exceeding_limit.each do |record|
        puts "  Record ID: #{record.id}, Current Length: #{record.safe_name.length}"
      end
    end
    if compound_properties_exceeding_limit.any? or batch_properties_exceeding_limit.any?
      raise "Migration aborted: Records found exceeding the new column limit." 
    end
  end

  def down
    # No action needed for down migration of a check
  end
end
