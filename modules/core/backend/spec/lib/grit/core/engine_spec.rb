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

require "rails_helper"

# The structure-dump hook. `ignore_tables` cannot reach a table that is not on the
# search path, and every DynamicSchema table lives in a schema of its own, so
# without this pg_dump writes every runtime schema into structure.sql.
#
# Driven through the adapter task rather than through Rake: `db:schema:dump` is
# not the only route to a structure dump — `db:schema:dump:<name>` is a sibling of
# it, and `db:prepare` calls `DatabaseTasks.dump_schema` outright — and
# `Rails.application.load_tasks` is not safe to call from a spec, since it re-runs
# every `rake_tasks` block and re-appends every `enhance`.
RSpec.describe "Grit::Core::Engine structure dump" do
  def tasks
    ActiveRecord::Tasks::PostgreSQLDatabaseTasks.new(ActiveRecord::Base.connection_db_config)
  end

  # Nothing here should actually shell out to pg_dump. `remove_sql_header_comments`
  # reads the file pg_dump would have written, so it goes too; the append at the
  # end of `structure_dump` is left alone and writes to the tmp path below.
  def dump_flags
    adapter = tasks
    captured = nil
    allow(adapter).to receive(:run_cmd) { |_cmd, *args| captured = args }
    allow(adapter).to receive(:remove_sql_header_comments)

    Tempfile.create("structure") { |file| adapter.structure_dump(file.path, yield) }
    captured
  end

  # `dynamic_schema_prefix` registers from a model class body, so in an environment
  # that does not eager load there is nothing to exclude until the class is loaded.
  # That is what `EagerLoadBeforeSchemaDump` is for, and what the examples driving
  # `structure_dump` directly have to stand in for.
  before(:each) { Grit::SchemaDefinition }

  it "is installed on the adapter task" do
    expect(ActiveRecord::Tasks::PostgreSQLDatabaseTasks.ancestors)
      .to include(Grit::Core::Engine::ExcludeDynamicSchemasFromStructureDump)
  end

  # `Grit::SchemaDefinition` declares `dynamic_schema_prefix "test"`.
  it "excludes every declared prefix" do
    expect(dump_flags { nil }).to include("--exclude-schema=test_*")
  end

  # Asserted by inclusion, never by equality: `SCHEMA_PREFIXES` is a process-wide
  # Set that every includer ever defined has added itself to, this suite's
  # throwaway classes included.
  it "keeps the flags the caller passed" do
    flags = dump_flags { [ "--no-tablespaces" ] }

    expect(flags).to include("--no-tablespaces")
    expect(flags).to include("--exclude-schema=test_*")
  end

  it "accepts a single flag rather than a list" do
    expect(dump_flags { "--no-tablespaces" }).to include("--no-tablespaces", "--exclude-schema=test_*")
  end

  # The pattern is a prefix match, and deliberately so: pg_dump reads `*` as `.*`,
  # so this also excludes a `test_shared` nobody built here. No pg_dump pattern can
  # tell the two apart, which is why a declared prefix owns the whole `<prefix>_`
  # namespace. Pinned so that narrowing it to the schemas definitions actually own
  # is a decision someone makes, not one they make by accident.
  it "excludes the whole prefix namespace, not just the schemas definitions own" do
    expect(dump_flags { nil }).to include("--exclude-schema=test_*")
    expect(dump_flags { nil }).not_to include(a_string_matching(/--exclude-schema=test_[a-z]/))
  end

  it "adds an exclusion only once" do
    flags = dump_flags { [ "--exclude-schema=test_*" ] }

    expect(flags.count("--exclude-schema=test_*")).to eq(1)
  end

  it "leaves the dump alone when nothing has declared a prefix" do
    allow(Grit::Core::Model::DynamicSchema::SchemaDefinition).to receive(:schema_prefixes).and_return(Set.new)

    expect(dump_flags { nil }).not_to include(a_string_matching(/--exclude-schema/))
  end

  describe "eager loading" do
    it "is installed on DatabaseTasks" do
      expect(ActiveRecord::Tasks::DatabaseTasks.singleton_class.ancestors)
        .to include(Grit::Core::Engine::EagerLoadBeforeSchemaDump)
    end

    # Every dump funnels through `dump_schema`, including `db:prepare`, which
    # reaches it without going through a rake task at all. Eager loading here
    # rather than inside `structure_dump` keeps it outside `with_temporary_pool`,
    # which re-establishes the connection at the database being dumped.
    #
    # Stopped at `schema_dump_path`, which is the gate after the two the prepend
    # itself checks: `dump_schema` returns there, so nothing shells out to pg_dump,
    # and the eager load has already had its chance.
    def dump_schema(format, schema_dump: true)
      db_config = ActiveRecord::Base.connection_db_config
      allow(db_config).to receive(:schema_dump).and_return(schema_dump)
      allow(ActiveRecord::Tasks::DatabaseTasks).to receive(:schema_dump_path).and_return(nil)
      ActiveRecord::Tasks::DatabaseTasks.dump_schema(db_config, format)
    end

    it "eager loads before the dump, so the prefixes are registered" do
      expect(Rails.application).to receive(:eager_load!)

      dump_schema(:sql)
    end

    # The prefixes are only ever read by `ExcludeDynamicSchemasFromStructureDump`,
    # which patches `PostgreSQLDatabaseTasks#structure_dump` — the `:sql` branch.
    # `SchemaDumper` sees only what is on the search path, and a dynamic schema
    # never is. A ruby-format filter would need this back.
    it "does not eager load for a ruby dump" do
      expect(Rails.application).not_to receive(:eager_load!)

      dump_schema(:ruby)
    end

    # Guarded rather than paid unconditionally: a replica config with
    # `schema_dump: false` would otherwise eager load the whole application on
    # every `db:migrate`, and in development — where `eager_load` is off and so
    # never exercised — one NameError in app code would raise out of `db:migrate`
    # after the migrations had already committed.
    it "does not eager load when the config dumps no schema" do
      expect(Rails.application).not_to receive(:eager_load!)

      dump_schema(:sql, schema_dump: false)
    end
  end
end
