class RenameCompoundAndBatchOriginNames < ActiveRecord::Migration[7.2]
  def change
    rename_column :grit_compounds_compounds, :name, :number
    rename_column :grit_compounds_compounds, :origin_name, :name
    rename_column :grit_compounds_batches, :name, :number
    rename_column :grit_compounds_batches, :origin_name, :name
  end
end
