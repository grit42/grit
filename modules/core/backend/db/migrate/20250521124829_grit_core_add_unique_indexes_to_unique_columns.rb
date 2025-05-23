class GritCoreAddUniqueIndexesToUniqueColumns < ActiveRecord::Migration[7.2]
  def duplicates(klass, property)
    klass.select(:name)
      .group(:name)
      .having('COUNT(*) > 1')
      .map(&:name)
  end

  class DuplicateNameError < RuntimeError
  end

  def change
    duplicate_countries = duplicates(Grit::Core::Country, :name)
    raise DuplicateNameError.new("Duplicate country names: #{duplicate_countries.join(", ")}") if duplicate_countries.any?
    add_index :grit_core_countries, :name, unique: true, name: 'idx_countries_on_name_unique'

    duplicate_countries = duplicates(Grit::Core::Country, :iso)
    raise DuplicateNameError.new("Duplicate country ISO: #{duplicate_countries.join(", ")}") if duplicate_countries.any?
    add_index :grit_core_countries, :iso, unique: true, name: 'idx_countries_on_iso_unique'

    duplicate_locations = duplicates(Grit::Core::Location, :name)
    raise DuplicateNameError.new("Duplicate locations: #{duplicate_locations.join(", ")}") if duplicate_locations.any?
    add_index :grit_core_locations, :name, unique: true, name: 'idx_locations_on_name_unique'

    duplicate_origins = duplicates(Grit::Core::Origin, :name)
    raise DuplicateNameError.new("Duplicate origins: #{duplicate_origins.join(", ")}") if duplicate_origins.any?
    add_index :grit_core_origins, :name, unique: true, name: 'idx_origins_on_name_unique'

    duplicate_roles = duplicates(Grit::Core::Role, :name)
    raise DuplicateNameError.new("Duplicate roles: #{duplicate_roles.join(", ")}") if duplicate_roles.any?
    add_index :grit_core_roles, :name, unique: true, name: 'idx_roles_on_name_unique'

    duplicate_units = duplicates(Grit::Core::Unit, :name)
    raise DuplicateNameError.new("Duplicate unit names: #{duplicate_units.join(", ")}") if duplicate_units.any?
    add_index :grit_core_units, :name, unique: true, name: 'idx_units_on_name_unique'

    duplicate_units = duplicates(Grit::Core::Unit, :abbreviation)
    raise DuplicateNameError.new("Duplicate unit abbrevations: #{duplicate_units.join(", ")}") if duplicate_units.any?
    add_index :grit_core_units, :abbreviation, unique: true, name: 'idx_units_on_abbreviation_unique'

    duplicate_publication_statuses = duplicates(Grit::Core::PublicationStatus, :name)
    raise DuplicateNameError.new("Duplicate publication_statuses: #{duplicate_publication_statuses.join(", ")}") if duplicate_publication_statuses.any?
    add_index :grit_core_publication_statuses, :name, unique: true, name: 'idx_publication_statuses_on_name_unique'
  end
end
