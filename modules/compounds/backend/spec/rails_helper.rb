# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/compounds.
#
# @grit42/compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.


ENV["RAILS_ENV"] ||= "test"

# Boot the existing dummy app (loads Rails + ActiveSupport)
require_relative "../test/dummy/config/environment"

# Dev dependencies declared in gemspec are not auto-required by Bundler.require;
# load them explicitly after Rails boots (they depend on ActiveSupport).
require "authlogic/test_case"
require "rswag/specs"
require "rspec/rails"

# Configure migration paths
ActiveRecord::Migrator.migrations_paths = [
  File.expand_path("../test/dummy/db/migrate", __dir__),
  File.expand_path("../db/migrate", __dir__)
]

# Load support files
Dir[File.expand_path("support/**/*.rb", __dir__)].each { |f| require f }

# File fixtures path (shared with minitest)
FILE_FIXTURE_PATH = File.expand_path("../test/fixtures/files", __dir__)

# PostgreSQL adapter monkey-patch to register custom RDKit mol type decoder.
# The mol column type (OID 31783) is not recognized by the PG gem by default.
# We use `prepend` so that `super` correctly invokes the original
# PostgreSQLAdapter#configure_connection (class_eval would skip it, going
# straight to AbstractAdapter and leaving @type_map_for_results nil).
module RDKitMolTypeMapPatch
  def configure_connection
    super
    mol_oid = @raw_connection.exec("SELECT oid FROM pg_type WHERE typname = 'mol' LIMIT 1").first
    return unless mol_oid

    oid = mol_oid["oid"].to_i
    decoder = PG::TextDecoder::String.new(oid: oid, name: "mol")
    @raw_connection.type_map_for_results.add_coder(decoder)
  rescue => e
    # Silent rescue to avoid crash during db:create/migrate when
    # the RDKit extension is not installed or table doesn't exist.
    Rails.logger.debug { "RDKitMolTypeMapPatch: #{e.message}" } if defined?(Rails)
  end
end

ActiveSupport.on_load(:active_record) do
  ActiveRecord::ConnectionAdapters::PostgreSQLAdapter.prepend(RDKitMolTypeMapPatch)
end

RSpec.configure do |config|
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!

  # Clean up any data left by previous minitest fixture loads or seed data.
  config.before(:suite) do
    ActiveRecord::Base.connection.execute("SET session_replication_role = 'replica'")
    %w[
      grit_compounds_molecules_compounds grit_compounds_synonyms
      grit_compounds_batch_property_values grit_compounds_compound_property_values
      grit_compounds_batches grit_compounds_compounds
      grit_compounds_molecules grit_compounds_compound_types
      grit_compounds_batch_properties grit_compounds_compound_properties
      grit_core_user_roles grit_core_users grit_core_roles
      grit_core_origins grit_core_locations grit_core_countries
      grit_core_data_types grit_core_units grit_core_publication_statuses
      grit_core_load_set_block_loaded_records grit_core_load_set_blocks
      grit_core_load_set_statuses grit_core_load_sets
    ].each do |table|
      ActiveRecord::Base.connection.execute("DELETE FROM #{table}")
    rescue ActiveRecord::StatementInvalid
      # Table may not exist yet
    end
    ActiveRecord::Base.connection.execute("SET session_replication_role = 'origin'")
  end

  # Include Authlogic test helpers
  config.include Authlogic::TestCase

  # Include engine routes in request specs
  config.include Grit::Core::Engine.routes.url_helpers, type: :request

  # Activate authlogic and seed a bootstrap user so that factory_bot can
  # create records without hitting the set_updater "no session" error.
  # IMPORTANT: Always reset RequestStore — transactional fixtures rollback the
  # DB but do NOT clear RequestStore, so stale User objects from the previous
  # test would bypass the bootstrap and cause NoMethodError on role lookups.
  config.before(:each) do
    RequestStore.store.clear
    activate_authlogic
    bootstrap = Struct.new(:login, :id) do
      def role?(_name = nil)
        true
      end

      def active?
        true
      end
    end.new("factory_bootstrap", 0)
    RequestStore.store["current_user"] = bootstrap

    # Seed LoadSetStatus records required by EntityLoader (formerly from
    # minitest fixtures). Integration specs that go through the LoadSets
    # controller need these to exist.
    %w[Created Initializing Mapping Mapped Validating Validated
       Invalidated Succeeded Errored].each do |status_name|
      Grit::Core::LoadSetStatus.find_or_create_by!(name: status_name) do |s|
        s.description = status_name
      end
    end
  end

  # Helper to resolve file fixtures
  config.add_setting :file_fixture_path, default: FILE_FIXTURE_PATH
end
