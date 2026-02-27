# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/assays.
#
# @grit42/assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/assays. If not, see <https://www.gnu.org/licenses/>.


require "rails_helper"

module Grit::Assays
  RSpec.describe DataTable, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

    before do
      Grit::Core::UserSession.create(admin)
    end

    # --- Basic Model Behavior ---

    describe "model behavior" do
      it "class exists and includes GritEntityRecord" do
        expect(defined?(DataTable)).to be_truthy
        expect(DataTable.include?(Grit::Core::GritEntityRecord)).to be true
      end

      it "belongs to entity_data_type" do
        expect(DataTable.reflect_on_association(:entity_data_type)).to be_present
        expect(DataTable.reflect_on_association(:entity_data_type).macro).to eq(:belongs_to)
      end
    end

    # --- Entity Properties ---

    describe ".entity_properties" do
      it "excludes plots field" do
        properties = DataTable.entity_properties
        property_names = properties.map { |p| p[:name] }
        expect(property_names).not_to include("plots")
      end

      it "includes entity_data_type_id with scope param" do
        properties = DataTable.entity_properties
        entity_data_type_prop = properties.find { |p| p[:name] == "entity_data_type_id" }

        expect(entity_data_type_prop).not_to be_nil
        expect(entity_data_type_prop.dig(:entity, :params, :scope)).to eq("entity_data_types")
      end
    end

    # --- Callbacks ---

    describe "callbacks" do
      it "delete_dependents callback exists" do
        expect(DataTable.method_defined?(:delete_dependents)).to be true
      end

      it "add_entity_type_display_columns callback exists" do
        expect(DataTable.method_defined?(:add_entity_type_display_columns)).to be true
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = DataTable.entity_crud

        expect(crud[:create]).to include("Administrator")
        expect(crud[:create]).to include("AssayAdministrator")
        expect(crud[:create]).to include("AssayUser")
        expect(crud[:update]).to include("Administrator")
        expect(crud[:update]).to include("AssayAdministrator")
        expect(crud[:update]).to include("AssayUser")
        expect(crud[:destroy]).to include("Administrator")
        expect(crud[:destroy]).to include("AssayAdministrator")
        expect(crud[:destroy]).to include("AssayUser")
        expect(crud[:read]).to be_empty
      end
    end

    # Note: Full DataTable testing with actual entity data types requires
    # entity data types that point to real models (e.g., Compound, Batch).
    # This requires seeds to be loaded or complex fixture setup.
    # These tests focus on the model structure and callbacks.
  end
end
