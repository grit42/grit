class GritCompoundsAddUniqueIndexesToUniqueColumns < ActiveRecord::Migration[7.2]
  def duplicates(klass, property)
     klass.select(property)
      .group(property)
       .having('COUNT(*) > 1')
      .map(&property)
  end

  class DuplicateNameError < RuntimeError
  end

  def change
    duplicate_compound_types = duplicates(Grit::Compounds::CompoundType, :name)
    raise DuplicateNameError.new("Duplicate compound type names: #{duplicate_compound_types.join(", ")}") if duplicate_compound_types.any?
    add_index :grit_compounds_compound_types, :name, unique: true, name: 'idx_grit_compounds_compound_types_on_name_unique'

    duplicate_compound_property_names = duplicates(Grit::Compounds::CompoundProperty, :name)
    raise DuplicateNameError.new("Duplicate compound property names: #{duplicate_compound_property_names.join(", ")}") if duplicate_compound_property_names.any?
    add_index :grit_compounds_compound_properties, :name, unique: true, name: 'idx_grit_compounds_compound_properties_on_name_unique'
    add_index :grit_compounds_compound_properties, :safe_name, unique: true, name: 'idx_grit_compounds_compound_properties_on_safe_name_unique'

    duplicate_batch_property_names = duplicates(Grit::Compounds::BatchProperty, :name)
    raise DuplicateNameError.new("Duplicate batch property names: #{duplicate_batch_property_names.join(", ")}") if duplicate_batch_property_names.any?
    add_index :grit_compounds_batch_properties, :name, unique: true, name: 'idx_grit_compounds_batch_properties_on_name_unique'
    add_index :grit_compounds_batch_properties, :safe_name, unique: true, name: 'idx_grit_compounds_batch_properties_on_safe_name_unique'

    duplicate_compound_names = duplicates(Grit::Compounds::Compound, :name)
    raise DuplicateNameError.new("Duplicate compound names: #{duplicate_compound_names.join(", ")}") if duplicate_compound_names.any?
    add_index :grit_compounds_compounds, :name, unique: true, name: 'idx_grit_compounds_compounds_on_name_unique'
    add_index :grit_compounds_compounds, :number, unique: true, name: 'idx_grit_compounds_compounds_on_number_unique'

    duplicate_synonym_names = duplicates(Grit::Compounds::Synonym, :name)
    raise DuplicateNameError.new("Duplicate synonym names: #{duplicate_synonym_names.join(", ")}") if duplicate_synonym_names.any?
    add_index :grit_compounds_synonyms, :name, unique: true, name: 'idx_grit_compounds_compound_synonyms_on_name_unique'

    duplicate_batch_names = duplicates(Grit::Compounds::Batch, :name)
    raise DuplicateNameError.new("Duplicate batch names: #{duplicate_batch_names.join(", ")}") if duplicate_synonym_names.any?
    add_index :grit_compounds_batches, :name, unique: true, name: 'idx_grit_compounds_batches_on_name_unique'
    add_index :grit_compounds_batches, :number, unique: true, name: 'idx_grit_compounds_batches_on_number_unique'
  end
end
