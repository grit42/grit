# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/assays.
#
# @grit42/assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/assays. If not, see <https://www.gnu.org/licenses/>.


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

  # Include Authlogic test helpers
  config.include Authlogic::TestCase

  # Include engine routes in request specs
  config.include Grit::Core::Engine.routes.url_helpers, type: :request

  # Activate authlogic and seed a bootstrap user so that factory_bot can
  # create records without hitting the set_updater "no session" error.
  config.before(:each) do
    activate_authlogic
    unless RequestStore.store["current_user"]
      bootstrap = Struct.new(:login, :id) do
        def role?(_name = nil)
          true
        end

        def active?
          true
        end
      end.new("factory_bootstrap", 0)
      RequestStore.store["current_user"] = bootstrap
    end
  end

  # Dynamic tables (ds_{id}) are created via DDL and are not rolled back by
  # test transactions. Drop any that leaked after each test.
  config.after(:each) do
    leaked = ActiveRecord::Base.connection.tables.select { |t| t.start_with?("ds_") }
    leaked.each { |t| ActiveRecord::Base.connection.drop_table(t, force: true) }
  end

  # Helper to resolve file fixtures
  config.add_setting :file_fixture_path, default: FILE_FIXTURE_PATH
end
