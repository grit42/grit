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

# `ignore_tables` can't reach tables outside the search path, so without this hook pg_dump
# writes every DynamicSchema schema into structure.sql. Driven through the adapter task:
# Rake has several dump routes, and `load_tasks` is unsafe to call from a spec.
RSpec.describe "Grit::Core::Engine structure dump" do
  def tasks
    ActiveRecord::Tasks::PostgreSQLDatabaseTasks.new(ActiveRecord::Base.connection_db_config)
  end

  # Captures the flags pg_dump would get without running it. `remove_sql_header_comments`
  # reads pg_dump's output file, so it is stubbed too.
  def dump_flags
    adapter = tasks
    captured = nil
    allow(adapter).to receive(:run_cmd) { |_cmd, *args| captured = args }
    allow(adapter).to receive(:remove_sql_header_comments)

    Tempfile.create("structure") { |file| adapter.structure_dump(file.path, yield) }
    captured
  end

  it "is installed on the adapter task" do
    expect(ActiveRecord::Tasks::PostgreSQLDatabaseTasks.ancestors)
      .to include(Grit::Core::Engine::ExcludeDynamicSchemasFromStructureDump)
  end

  # The dummy app declares `config.grit.dynamic_schema_prefixes << "test"`.
  it "excludes every declared prefix" do
    expect(dump_flags { nil }).to include("--exclude-schema=test_*")
  end

  it "keeps the flags the caller passed" do
    flags = dump_flags { [ "--no-tablespaces" ] }

    expect(flags).to include("--no-tablespaces")
    expect(flags).to include("--exclude-schema=test_*")
  end

  it "accepts a single flag rather than a list" do
    expect(dump_flags { "--no-tablespaces" }).to include("--no-tablespaces", "--exclude-schema=test_*")
  end

  # Deliberately a prefix match: no pg_dump pattern can tell owned schemas from e.g.
  # `test_shared`, so a declared prefix owns the whole `<prefix>_` namespace.
  it "excludes the whole prefix namespace, not just the schemas definitions own" do
    expect(dump_flags { nil }).to include("--exclude-schema=test_*")
    expect(dump_flags { nil }).not_to include(a_string_matching(/--exclude-schema=test_[a-z]/))
  end

  it "adds an exclusion only once" do
    flags = dump_flags { [ "--exclude-schema=test_*" ] }

    expect(flags.count("--exclude-schema=test_*")).to eq(1)
  end

  it "keeps a flag the caller repeats" do
    flags = dump_flags { [ "-T", "a", "-T", "b" ] }

    expect(flags.each_cons(4).to_a).to include([ "-T", "a", "-T", "b" ])
  end

  it "leaves the dump alone when nothing has declared a prefix" do
    allow(Grit::Core::Engine.config.grit).to receive(:dynamic_schema_prefixes).and_return([])

    expect(dump_flags { nil }).not_to include(a_string_matching(/--exclude-schema/))
  end

  it "reads the prefixes from config, without eager loading" do
    allow(Grit::Core::Engine.config.grit).to receive(:dynamic_schema_prefixes).and_return([ "zz" ])
    expect(Rails.application).not_to receive(:eager_load!)

    expect(dump_flags { nil }).to include("--exclude-schema=zz_*")
  end

  # A `*` or `?` would widen the pattern past the prefix's own schemas.
  it "refuses a malformed prefix in config" do
    allow(Grit::Core::Engine.config.grit).to receive(:dynamic_schema_prefixes).and_return([ "zz*" ])

    expect { dump_flags { nil } }.to raise_error(ArgumentError, /lowercase letters/)
  end
end
