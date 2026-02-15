# Configure Rails Environment
ENV["RAILS_ENV"] = "test"

require "authlogic"
require "authlogic/test_case"

require_relative "../test/dummy/config/environment"
ActiveRecord::Migrator.migrations_paths = [ File.expand_path("../test/dummy/db/migrate", __dir__) ]
ActiveRecord::Migrator.migrations_paths << File.expand_path("../db/migrate", __dir__)
require "rails/test_help"

# Load support files
Dir[File.expand_path("support/**/*.rb", __dir__)].each { |f| require f }

# Load fixtures from the engine
if ActiveSupport::TestCase.respond_to?(:fixture_paths=)
  ActiveSupport::TestCase.fixture_paths = [ File.expand_path("fixtures", __dir__) ]
  ActiveSupport::TestCase.fixture_paths << File.expand_path("dummy/test/fixtures", __dir__)
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
