# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.


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

RSpec.configure do |config|
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!

  # Clean up any data left by previous minitest fixture loads or seed data.
  # Transactional fixtures only rollback within each test — they don't clear
  # data that existed before the suite started.
  config.before(:suite) do
    ActiveRecord::Base.connection.execute("SET session_replication_role = 'replica'")
    %w[
      grit_core_user_roles grit_core_users grit_core_roles
      grit_core_origins grit_core_locations grit_core_countries
      grit_core_data_types grit_core_units grit_core_publication_statuses
      grit_core_vocabulary_items grit_core_vocabularies
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
  # The GritEntityRecord concern calls User.current on every save, which
  # reads from RequestStore. Fixtures bypassed this (no callbacks), but
  # factory_bot triggers callbacks, so we need a user in RequestStore
  # before any factory creates run.
  config.before(:each) do
    # IMPORTANT: Always clear RequestStore. Transactional fixtures rollback the
    # DB between tests but do NOT clear RequestStore, so stale User objects from
    # a previous test would bypass the bootstrap stub and cause NoMethodError on
    # role lookups (the real user and its roles no longer exist after rollback).
    # NOTE: Clear BEFORE activate_authlogic because authlogic stores its
    # controller in RequestStore.store[:authlogic_controller].
    RequestStore.store.clear
    activate_authlogic

    # Place a temporary stub in RequestStore so model callbacks (set_updater,
    # check_role, check_user) don't blow up while factory_bot creates the
    # initial user and its associations. The stub must respond to the same
    # methods the callbacks call on User.current.
    # Specs that call set_current_user(admin) or login_as(admin) will clear
    # the stub so User.current re-fetches the real user from the session.
    RequestStore.store["current_user"] = Struct.new(:login, :id) do
      def role?(_name = nil)
        true
      end

      def active?
        true
      end
    end.new("factory_bootstrap", 0)
  end

  # Helper to resolve file fixtures
  config.add_setting :file_fixture_path, default: FILE_FIXTURE_PATH
end
