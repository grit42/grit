# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.


require "rails_helper"

# Tests for the DynamicSchema::ValidIdentifier concern, which owns the rules all
# three of SchemaDefinition, TableDefinition and ColumnDefinition hold their
# `identifier` to. Exercised through all three dummy models, since the point of
# the concern is that there is one copy of the rules rather than three.
RSpec.describe "DynamicSchema::ValidIdentifier concern", type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:schema) { Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema") }
  let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }
  let(:string_type) { create(:grit_core_data_type, :string) }

  before(:each) do
    set_current_user(admin)
  end

  # Each includer, with a block that builds an unsaved record carrying the given
  # identifier. SchemaDefinition needs nothing else; the other two need a parent.
  def build_with_identifier(model, identifier)
    case model
    when :schema then Grit::SchemaDefinition.new(identifier: identifier, name: "X")
    when :table then Grit::TableDefinition.new(identifier: identifier, name: "X", schema_definition: schema)
    when :column then Grit::ColumnDefinition.new(identifier: identifier, name: "X", data_type: string_type, table_definition: table)
    end
  end

  # ==========================================================================
  # T14 — the shared validations live here, once
  # ==========================================================================

  describe "shared validations (T14)" do
    %i[schema table column].each do |model|
      context "on #{model} definitions" do
        it "requires an identifier" do
          record = build_with_identifier(model, nil)
          expect(record).not_to be_valid
          expect(record.errors[:identifier]).to include("can't be blank")
        end

        it "rejects an identifier shorter than two characters" do
          record = build_with_identifier(model, "a")
          expect(record).not_to be_valid
          expect(record.errors[:identifier].join).to match(/too short/)
        end

        it "rejects an identifier longer than thirty characters" do
          record = build_with_identifier(model, "a" * (Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH + 1))
          expect(record).not_to be_valid
          expect(record.errors[:identifier].join).to match(/too long/)
        end

        it "accepts an identifier at the limit" do
          record = build_with_identifier(model, "a" * Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH)
          expect(record).to be_valid
        end

        it "rejects an identifier that does not start with two lowercase letters" do
          record = build_with_identifier(model, "1abc")
          expect(record).not_to be_valid
          expect(record.errors[:identifier]).to include("should start with two lowercase letters or underscores")
        end

        it "rejects an identifier carrying anything but lowercase letters, numbers and underscores" do
          record = build_with_identifier(model, "ab_cd1")
          expect(record).to be_valid

          record = build_with_identifier(model, "abCd")
          expect(record).not_to be_valid
          expect(record.errors[:identifier]).to include("should contain only lowercase letters, numbers and underscores")
        end

        # There used to be a fifth, looser /\A[a-zA-Z0-9_]*\z/ validation in this
        # concern on top of the four each includer declared for itself, so a
        # single bad character produced two messages saying the same thing.
        it "reports one message, not two, for one bad character" do
          record = build_with_identifier(model, "ab-cd")
          expect(record).not_to be_valid
          expect(record.errors[:identifier]).to eq([ "should contain only lowercase letters, numbers and underscores" ])
        end
      end
    end
  end

  # ==========================================================================
  # T14 — reserved identifiers are a class_attribute an includer extends
  # ==========================================================================

  describe "reserved identifiers (T14)" do
    it "defaults to the columns every dynamic table has" do
      expect(Grit::ColumnDefinition.reserved_identifiers)
        .to eq(%w[id created_at created_by updated_at updated_by])
    end

    %w[id created_at created_by updated_at updated_by].each do |reserved|
      it "rejects #{reserved.inspect}" do
        record = build_with_identifier(:column, reserved)
        expect(record).not_to be_valid
        expect(record.errors[:identifier]).to include("is a reserved keyword and cannot be used as identifier")
      end
    end

    it "rejects a name that collides with an ActiveRecord::Base instance method" do
      record = build_with_identifier(:column, "save")
      expect(record).not_to be_valid
      expect(record.errors[:identifier]).to include("is a reserved keyword and cannot be used as identifier")
    end

    # Core used to hardcode "experiment_id", which is an assays concept and has
    # no business in the core module.
    it "no longer reserves the assays-specific experiment_id" do
      expect(build_with_identifier(:column, "experiment_id")).to be_valid
    end

    # `reserved_identifiers` is static, so it cannot know what the table this
    # column belongs to adds on top of the base columns. Without a check against
    # the table's own implementation columns, this passes validation and then
    # raises PG::DuplicateColumn from inside `after_create :create_column`.
    it "rejects an identifier the table already uses for an implementation column" do
      record = build_with_identifier(:column, "owner_id")

      expect(record).not_to be_valid
      expect(record.errors[:identifier]).to include("is reserved by this table and cannot be used as identifier")
    end

    it "lets an includer add its own without disturbing its siblings" do
      klass = Class.new(Grit::ColumnDefinition) do
        def self.name = "ReservingColumnDefinition"
        self.reserved_identifiers += %w[experiment_id]
      end

      reserving = klass.new(identifier: "experiment_id", name: "X", data_type: string_type, table_definition: table)
      expect(reserving).not_to be_valid
      expect(reserving.errors[:identifier]).to include("is a reserved keyword and cannot be used as identifier")

      # The default is frozen and replaced rather than mutated, so neither the
      # parent nor the other two concerns see the addition.
      expect(Grit::ColumnDefinition.reserved_identifiers).not_to include("experiment_id")
      expect(Grit::TableDefinition.reserved_identifiers).not_to include("experiment_id")
      expect(Grit::SchemaDefinition.reserved_identifiers).not_to include("experiment_id")
      expect(build_with_identifier(:column, "experiment_id")).to be_valid
    end
  end
end
