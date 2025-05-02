class AddRecordWarningsToGritCoreLoadSets < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_core_load_sets, :record_warnings, :json
  end
end
