# Configure Rails Environment
ENV["RAILS_ENV"] = "test"

require "authlogic"
require "authlogic/test_case"

require_relative "../test/dummy/config/environment"
ActiveRecord::Migrator.migrations_paths = [ File.expand_path("../test/dummy/db/migrate", __dir__) ]
ActiveRecord::Migrator.migrations_paths << File.expand_path("../db/migrate", __dir__)
require "rails/test_help"

# Load fixtures from the engine
if ActiveSupport::TestCase.respond_to?(:fixture_paths=)
  ActiveSupport::TestCase.fixture_paths = [ File.expand_path("fixtures", __dir__) ]
  ActiveSupport::TestCase.fixture_paths << Grit::Core::Engine.root.join("test", "fixtures")

  ActionDispatch::IntegrationTest.fixture_paths = ActiveSupport::TestCase.fixture_paths
  ActiveSupport::TestCase.file_fixture_path = File.expand_path("fixtures", __dir__) + "/files"
  ActiveSupport::TestCase.fixtures :all
end

def login(user, password = "password")
  post "/api/grit/core/user_session", params: { user_session: {
    login: user.login, password: password } }
end

def logout
  delete "/api/grit/core/user_session"
end

# Dynamic tables (ds_{id}) are created via DDL and are not rolled back by
# test transactions. This global teardown drops any that leaked due to a
# mid-test assertion failure, preventing cascading failures across the suite.
class ActiveSupport::TestCase
  teardown do
    leaked = ActiveRecord::Base.connection.tables.select { |t| t.start_with?("ds_") }
    leaked.each { |t| ActiveRecord::Base.connection.drop_table(t, force: true) }
  end
end
