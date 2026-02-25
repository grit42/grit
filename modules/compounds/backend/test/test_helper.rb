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
  ActiveSupport::TestCase.fixture_paths << File.expand_path("dummy/test/fixtures", __dir__)
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

def silence_stderr
  original_stderr = $stderr.clone
  $stderr.reopen(File.new("/dev/null", "w"))
  yield
ensure
  $stderr.reopen(original_stderr)
end

ActiveSupport.on_load(:active_record) do
  ActiveRecord::ConnectionAdapters::PostgreSQLAdapter.class_eval do
    def configure_connection
      super
      # Her går vi helt ned i den rå PG-forbindelse
      # og kopierer tekst-dekoderen (OID 25) over på mol-OID (31783)
      raw_conn = @connection
      text_decoder = raw_conn.type_map_for_results.coders.find { |c| c.oid == 25 }
      
      if text_decoder
        raw_conn.type_map_for_results.register_type(0, 31783, text_decoder)
      end
    rescue
      # Silent rescue for at undgå crash under db:create/migrate
    end
  end
end
