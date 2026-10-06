#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-core.
#
# grit-core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-core. If not, see <https://www.gnu.org/licenses/>.
#++

module Grit
  module Core
    class Engine < ::Rails::Engine
      isolate_namespace Grit::Core
      config.generators.api_only = true

      # Every schema prefix a `DynamicSchema::SchemaDefinition` includer uses,
      # declared by the engine or app that defines the includer:
      #
      #   config.grit.dynamic_schema_prefixes << "ds"
      #
      # Read by `ExcludeDynamicSchemasFromStructureDump` below. `dynamic_schema_prefix`
      # refuses a prefix that is not listed here.
      config.grit = ActiveSupport::OrderedOptions.new
      config.grit.dynamic_schema_prefixes = []

      def self.openapi_root
        root.join("openapi").to_s
      end

      def self.seeds
        { auto_seed: true }
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
          mount Grit::Core::Engine => "/api/#{Grit::Core::Engine.name.underscore.gsub(/\/engine/, "")}"
        end
      end

      initializer :swagger do |app|
        app.routes.append do
          mount Rswag::Ui::Engine => "/api-docs"
          mount Rswag::Api::Engine => "/api-docs"
        end

        Rswag::Ui.configure do |c|
          Rails::Engine.subclasses
            .select { |e| e.respond_to?(:openapi_root) }
            .each do |engine|
              Dir.glob(File.join(engine.openapi_root, "*", "openapi.json")).sort.each do |spec_file|
                module_name = File.basename(File.dirname(spec_file))
                label = "#{module_name.titleize} API"
                c.openapi_endpoint "/api-docs/#{module_name}/openapi.json", label
              end
            end
        end

        Rswag::Api.configure do |c|
          # Default fallback (not normally used — engines take precedence)
          c.openapi_root = Rails.root.join("openapi").to_s
        end

        app.config.after_initialize do
          openapi_roots = Rails::Engine.subclasses
            .select { |e| e.respond_to?(:openapi_root) && File.directory?(e.openapi_root) }
            .map(&:openapi_root)

          # Override the config's path resolution to check each engine's openapi_root
          # for a matching file. The middleware's built-in directory traversal protection
          # (File.expand_path + start_with? guard) continues to work because the
          # returned root always matches the resolved filename.
          Rswag::Api.config.define_singleton_method(:resolve_openapi_root) do |env|
            path = env["PATH_INFO"]
            openapi_roots.find do |root|
              filename = File.expand_path(File.join(root, path))
              filename.start_with?(root) && File.file?(filename)
            end || openapi_root # fallback to default
          end
        end
      end

      initializer :ignore_tables do |app|
        ActiveRecord::SchemaDumper.ignore_tables << /^lsb_.*$/
        ActiveRecord::SchemaDumper.ignore_tables << /^raw_lsb_.*$/
      end

      # Keeps DynamicSchema schemas out of structure.sql. They are off the search
      # path, so `ignore_tables` cannot reach them, and pg_dump would otherwise
      # dump every one in the database.
      #
      # Excluded rather than dumping only `public`: `dump_schemas = "public"`
      # makes pg_dump emit `CREATE SCHEMA public`, which fails to reload.
      #
      # Each prefix in `config.grit.dynamic_schema_prefixes` excludes the whole
      # `<prefix>_*` namespace, so no migration may create a schema under it: it
      # would drop out of structure.sql. Excluding only the schemas definitions
      # own would mean querying the database being dumped. The prefixes come from
      # config so that a dump never has to load a model.
      #
      # Hooked on `PostgreSQLDatabaseTasks#structure_dump` because every dump path
      # reaches it (`db:schema:dump`, `db:migrate:<name>`, `db:prepare`, ...), and
      # it takes the flags as an argument, so nothing global is mutated.
      module ExcludeDynamicSchemasFromStructureDump
        def structure_dump(filename, extra_flags)
          prefixes = Grit::Core::Model::DynamicSchema::SchemaDefinition.schema_prefixes
          return super if prefixes.empty?
          # Not `|`: a union would also collapse the caller's own repeated flags,
          # turning `-T a -T b` into `-T a b`.
          flags = Array(extra_flags)
          super(filename, flags + (prefixes.map { |prefix| "--exclude-schema=#{prefix}_*" } - flags))
        end
      end

      initializer :exclude_dynamic_schemas_from_structure_dump do
        ActiveRecord::Tasks::PostgreSQLDatabaseTasks.prepend(ExcludeDynamicSchemasFromStructureDump)
      end
    end
  end
end
