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

      # `ignore_tables` above only reaches tables pg_dump can see on the search
      # path, which is every dynamic table built the old way — `lsb_<id>` and
      # friends all live in `public`. The DynamicSchema concerns put theirs in a
      # schema of their own instead, where that filter cannot reach them, and
      # pg_dump with no restriction would write every one of them into
      # structure.sql the next time anyone migrated a database that had some.
      #
      # Excluded by name rather than dumped by `dump_schemas = "public"`:
      # restricting the dump makes pg_dump emit `CREATE SCHEMA public`, which
      # then fails to reload under the `ON_ERROR_STOP=1` psql runs with.
      #
      # The exclusion is a *prefix match*, not a match on the schemas definitions
      # actually own: pg_dump reads `*` as `.*`, so a declared prefix of `ds`
      # excludes `ds_shared` as surely as `ds_myset`. No pg_dump pattern can tell
      # the two apart, and neither can this — so a declared `dynamic_schema_prefix`
      # owns the whole `<prefix>_` namespace, and no migration may create a schema
      # under it. One that does drops out of structure.sql on the next dump, and
      # the next `db:prepare` or CI run fails loading it with PG::UndefinedTable.
      #
      # Excluding by resolved name instead would need the definition rows read
      # from inside the dump, which is a query in a path that has to work against
      # a database that may not have the definitions table yet. The prefix rule is
      # cheaper and the collision is a naming decision, made once.
      #
      # Hooked on the adapter task rather than on a rake task, because
      # `db:schema:dump` is not the only thing that writes structure.sql:
      # `db:schema:dump:<name>` is a sibling of it rather than a dependent, and
      # `db:migrate:<name>`, `db:rollback:<name>` and `db:reset:<name>` all route
      # through that one; `db:prepare` skips both and calls
      # `DatabaseTasks.dump_schema` outright. Every one of them ends up here.
      #
      # `PostgreSQLDatabaseTasks#structure_dump` also takes its flags as an
      # argument, which is what makes this the right seam: there is no
      # `DatabaseTasks.structure_dump_flags` to mutate and put back — a setting
      # that may be a Hash keyed by adapter, so merging into it means knowing
      # which adapter is being dumped — and the flags cannot leak to another
      # adapter's dump. It is also where `ignore_tables` is applied, so the two
      # filters sit together.
      module ExcludeDynamicSchemasFromStructureDump
        def structure_dump(filename, extra_flags)
          prefixes = Grit::Core::Model::DynamicSchema::SchemaDefinition.schema_prefixes
          return super if prefixes.empty?
          super(filename, Array(extra_flags) | prefixes.map { |prefix| "--exclude-schema=#{prefix}_*" })
        end
      end

      # The prefixes are declared in model class bodies, which are not loaded yet
      # in an environment that does not eager load — and development is exactly
      # where structure.sql gets rewritten.
      #
      # Here rather than in the module above, because `dump_schema` wraps the whole
      # dump in `with_temporary_pool`, which re-establishes the connection at the
      # database being dumped. Eager loading inside that window would resolve any
      # model that touches the database on load against the wrong one.
      #
      # Guarded against the same two conditions `dump_schema` itself checks before
      # it does anything, so a full eager load is not the price of every
      # `db:migrate`. It returns on `unless db_config.schema_dump`, and only the
      # `:sql` branch reaches `structure_dump`. Without the guard, an app on
      # schema.rb, or one with `schema_dump: false` on a replica config, pays an
      # eager load per configured database per migration for a dump that is never
      # going to read a prefix.
      #
      # What the guard does not remove, because it cannot: a structure dump in
      # development does need the eager load, and development is where
      # `config.eager_load` is off and so where app code is never otherwise loaded
      # as a whole. A NameError anywhere in it will raise out of `db:migrate`,
      # after the migrations have committed. Left to raise on purpose — the
      # migrations are recorded and re-running `db:migrate` once the constant
      # resolves rewrites structure.sql, whereas rescuing here would dump a
      # structure.sql built from a half-registered set of prefixes and commit a
      # runtime schema into it silently.
      #
      # `format&.to_sym`, because `db:schema:dump` passes
      # `ENV["SCHEMA_FORMAT"] || db_config.schema_format` and so may hand us a
      # String.
      #
      # Skipping `:ruby` is safe only as long as the filter above is the only one:
      # `SchemaDumper` sees just the tables on the search path, and a dynamic
      # schema is never on it. A ruby-format filter would need the eager load back.
      module EagerLoadBeforeSchemaDump
        def dump_schema(db_config, format = db_config.schema_format)
          Rails.application.eager_load! if defined?(Rails) && Rails.application &&
            format&.to_sym == :sql && db_config.schema_dump
          super
        end
      end

      initializer :exclude_dynamic_schemas_from_structure_dump do
        ActiveRecord::Tasks::DatabaseTasks.singleton_class.prepend(EagerLoadBeforeSchemaDump)
        ActiveRecord::Tasks::PostgreSQLDatabaseTasks.prepend(ExcludeDynamicSchemasFromStructureDump)
      end
    end
  end
end
