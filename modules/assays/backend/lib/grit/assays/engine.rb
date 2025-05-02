module Grit
  module Assays
    class Engine < ::Rails::Engine
      isolate_namespace Grit::Assays
      config.generators.api_only = true

      def self.seeds
        { auto_seed: true, prerequisites: [ Grit::Core::Engine ] }
      end

      initializer :append_migrations do |app|
        unless app.root.to_s.match root.to_s
          config.paths["db/migrate"].expanded.each do |expanded_path|
            app.config.paths["db/migrate"] << expanded_path
            ActiveRecord::Migrator.migrations_paths << expanded_path
          end
        end
      end

      initializer :mount_engine do |app|
        app.routes.append do
          mount Grit::Assays::Engine => "/api/#{Grit::Assays::Engine.name.underscore.gsub(/\/engine/, "")}"
        end
      end

      initializer :overrides do |app|
        overrides = "#{Grit::Assays::Engine.root}/app/overrides"
        app.autoloaders.main.ignore(overrides)
        config.to_prepare do
          Dir.glob("#{overrides}/**/*_override.rb").sort.each do |override|
            load override
          end
        end
      end
    end
  end
end
