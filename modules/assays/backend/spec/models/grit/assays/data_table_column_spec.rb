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
  RSpec.describe DataTableColumn, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

    before do
      set_current_user(admin)
    end

    # --- Basic Model Behavior ---

    describe "model behavior" do
      it "class exists and includes GritEntityRecord" do
        expect(defined?(DataTableColumn)).to be_truthy
        expect(DataTableColumn.include?(Grit::Core::GritEntityRecord)).to be true
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to data_table" do
        expect(DataTableColumn.reflect_on_association(:data_table)).to be_present
        expect(DataTableColumn.reflect_on_association(:data_table).macro).to eq(:belongs_to)
      end

      it "belongs to assay_data_sheet_column (optional)" do
        association = DataTableColumn.reflect_on_association(:assay_data_sheet_column)
        expect(association).to be_present
        expect(association.macro).to eq(:belongs_to)
        expect(association.options[:optional]).to be true
      end
    end

    # --- Validations ---

    describe "validations" do
      it "requires name minimum length of 1" do
        column = DataTableColumn.new(
          name: "",
          safe_name: "valid_safe",
          data_table_id: 1
        )
        expect(column).not_to be_valid
        expect(column.errors[:name].any? { |e| e.include?("too short") }).to be true
      end

      it "requires safe_name minimum length of 3" do
        column = DataTableColumn.new(
          name: "Valid Name",
          safe_name: "ab",
          data_table_id: 1
        )
        expect(column).not_to be_valid
        expect(column.errors[:safe_name].any? { |e| e.include?("too short") }).to be true
      end
    end

    # --- Class Methods ---

    describe "class methods" do
      it "detailed class method exists" do
        expect(DataTableColumn).to respond_to(:detailed)
      end

      it "selected class method exists" do
        expect(DataTableColumn).to respond_to(:selected)
      end

      it "available_entity_attributes class method exists" do
        expect(DataTableColumn).to respond_to(:available_entity_attributes)
      end

      it "available class method exists" do
        expect(DataTableColumn).to respond_to(:available)
      end
    end

    # --- Instance Methods ---

    describe "instance methods" do
      it "data_table_statement instance method exists" do
        column = DataTableColumn.new
        expect(column).to respond_to(:data_table_statement)
      end

      it "sql_aggregate_method instance method exists" do
        column = DataTableColumn.new
        expect(column).to respond_to(:sql_aggregate_method)
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = DataTableColumn.entity_crud

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

    # Note: Full DataTableColumn testing requires a DataTable with an entity
    # data type pointing to a real model. These tests focus on model structure
    # and validations that don't require database records.
  end
end
