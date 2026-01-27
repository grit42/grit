class RemoveAssaysTables < ActiveRecord::Migration[7.2]
  def up
    drop_table :grit_assays_assay_metadata
    drop_table :grit_assays_assays
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
