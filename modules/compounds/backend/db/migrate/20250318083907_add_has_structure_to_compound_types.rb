class AddHasStructureToCompoundTypes < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_compounds_compound_types, :has_structure, :boolean, default: false
  end
end
