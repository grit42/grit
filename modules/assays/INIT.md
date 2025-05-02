# Starting a new module

## Generate the rails app

```sh
rails plugin new grit-<module_name> \
  --mountable \
  --api \
  --database=postgresql \
  --skip-git \
  --skip-docker \
  --skip-ci \
  --skip-action-mailbox \
  --skip-action-text \
  --skip-active-job \
  --skip-active-storage \
  --skip-action-cable
```

## Housekeeping

- Add COPYING
- TODOs in gemspec
- Add grit-core dep in gemspec
- Add grit-core in Gemfile
- Remove the default route in `test/dummy/config/routes.rb`

## Configure the engine

```ruby
module Grit
  module ModuleName
    class Engine < ::Rails::Engine
      isolate_namespace Grit::Assays
      config.generators.api_only = true


      def self.seeds # Add auto seeding
        { auto_seed: true, prerequisites: [ Grit::Core::Engine ] }
      end

      initializer :append_migrations do |app|  # Add engine migrations to the host app automatically
        unless app.root.to_s.match root.to_s
          config.paths["db/migrate"].expanded.each do |expanded_path|
            app.config.paths["db/migrate"] << expanded_path
            ActiveRecord::Migrator.migrations_paths << expanded_path
          end
        end
      end

      initializer :mount_engine do |app| # Automatically mount engine in the host app
        app.routes.append do
          mount Grit::ModuleName::Engine => "/api/#{Grit::ModuleName::Engine.name.underscore.gsub(/\/engine/, "")}"
        end
      end
    end
  end
end
```

## Configure test_helper

Optionally, add the core modules fixtures and `login` util to the test helper
```diff
 # Configure Rails Environment
 ENV["RAILS_ENV"] = "test"

+require "authlogic"
+require "authlogic/test_case"
+
 require_relative "../test/dummy/config/environment"
 ActiveRecord::Migrator.migrations_paths = [ File.expand_path("../test/dummy/db/migrate", __dir__) ]
 ActiveRecord::Migrator.migrations_paths << File.expand_path("../db/migrate", __dir__)
 require "rails/test_help"

 # Load fixtures from the engine
 if ActiveSupport::TestCase.respond_to?(:fixture_paths=)
   ActiveSupport::TestCase.fixture_paths = [ File.expand_path("fixtures", __dir__) ]
+  ActiveSupport::TestCase.fixture_paths << Grit::Core::Engine.root.join("test", "fixtures")
+
   ActionDispatch::IntegrationTest.fixture_paths = ActiveSupport::TestCase.fixture_paths
   ActiveSupport::TestCase.file_fixture_path = File.expand_path("fixtures", __dir__) + "/files"
   ActiveSupport::TestCase.fixtures :all
 end
+
+def login(user, password = "password") # TODO grit/test_helper
+  post "/api/grit/core/user_session", params: { user_session: {
+    login: user.login, password: password } }
+end
```

## Configure the dev/test application

### Application configuration

```diff
 module Dummy
   class Application < Rails::Application
     # ...
     config.api_only = true
+
+    config.active_record.schema_format = :sql
+
+    config.session_store :cookie_store, key: "_grit_session" # or whatever
+    config.middleware.use ActionDispatch::Cookies
+    config.middleware.use config.session_store, config.session_options
+
+   config.action_mailer.delivery_method = :smtp
+   config.action_mailer.smtp_settings = {
+     address: ENV.fetch("SMTP_SERVER", nil),
+     port: ENV.fetch("SMTP_PORT", nil),
+     user_name: ENV.fetch("SMTP_USER", nil),
+     password: ENV.fetch("SMTP_TOKEN", nil),
+     authentication: "plain",
+     enable_starttls_auto: true
+   }
   end
 end
```

### DB configuration

Update <module_name> to whatever your module is

```yml
default: &default
  adapter: postgresql
  encoding: unicode
  username: grit
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

local: &local
  <<: *default
  host: <%= ENV["POSTGRES_HOST"] || "127.0.0.1" %>
  port: <%= ENV["POSTGRES_PORT"] || 5432 %>
  password: <%= ENV["POSTGRES_PASSWORD"] || "muchsecurepasswordwow" %>

development:
  <<: *local
  database: <%= ENV["GRIT_DATABASE"] || "<module_name>" %>_dev

test:
  <<: *local
  database: <%= ENV["GRIT_DATABASE"] || "<module_name>" %>_test

production:
  <<: *default
  host: <%= ENV["POSTGRES_HOST"] %>
  port: <%= ENV["POSTGRES_PORT"] %>
  database: <%= ENV["GRIT_DATABASE"] || "<module_name>" %>
  password: <%= ENV["POSTGRES_PASSWORD"] %>
```

