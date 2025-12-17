class LimitBatchPropertyColumnSafename < ActiveRecord::Migration[7.2]
  def up
    change_column :grit_compounds_batch_properties, :safe_name, :string, limit: 30
  end
  def down
    change_column :grit_compounds_batch_properties, :safe_name, :string, limit: nil
  end
end
