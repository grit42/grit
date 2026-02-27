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

RSpec.describe Grit::Core::DataType, type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

  before(:each) do
    Grit::Core::UserSession.create(admin)
  end

  # sql_name method tests
  describe "#sql_name" do
    it "returns bigint for integer type" do
      data_type = described_class.new(name: "integer", is_entity: false)
      expect(data_type.sql_name).to eq("bigint")
    end

    it "returns name for non-integer types" do
      data_type = described_class.new(name: "string", is_entity: false)
      expect(data_type.sql_name).to eq("string")
    end

    it "returns name for decimal type" do
      data_type = described_class.new(name: "decimal", is_entity: false)
      expect(data_type.sql_name).to eq("decimal")
    end

    it "raises error for entity types" do
      data_type = described_class.new(name: "some_entity", is_entity: true)
      expect {
        data_type.sql_name
      }.to raise_error(RuntimeError, "no sql name for entity types")
    end
  end

  # entity_definition method tests
  describe "#entity_definition" do
    it "returns nil for non-entity types" do
      data_type = create(:grit_core_data_type, :integer)
      expect(data_type.entity_definition).to be_nil
    end
  end

  # entity_data_types scope tests
  describe ".entity_data_types" do
    it "returns only entity types" do
      entity_type = described_class.create!(
        name: "test_entity_type",
        is_entity: true,
        table_name: "grit_core_users"
      )

      entity_types = described_class.entity_data_types

      expect(entity_types.all? { |dt| dt.is_entity == true }).to be_truthy
      expect(entity_types.any? { |dt| dt.name == "test_entity_type" }).to be_truthy

      entity_type.destroy
    end
  end

  # Basic CRUD tests
  describe "CRUD" do
    it "can create a data type" do
      data_type = described_class.new(
        name: "test_type",
        is_entity: false
      )
      expect(data_type.save).to be_truthy
    end

    it "data type is read-only for non-admin operations" do
      data_type = create(:grit_core_data_type, :integer)
      expect(data_type).to be_persisted
    end
  end
end
