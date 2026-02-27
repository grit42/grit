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
  RSpec.describe DataTableRow, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

    before do
      Grit::Core::UserSession.create(admin)
    end

    # --- Basic Model Behavior ---

    describe "model behavior" do
      it "class exists and includes GritEntityRecord" do
        expect(defined?(DataTableRow)).to be_truthy
        expect(DataTableRow.include?(Grit::Core::GritEntityRecord)).to be true
      end

      it "uses data_table_entities table" do
        expect(DataTableRow.table_name).to eq("grit_assays_data_table_entities")
      end
    end

    # --- Class Methods ---

    describe "class methods" do
      it "for_data_table class method exists" do
        expect(DataTableRow).to respond_to(:for_data_table)
      end

      it "full_perspective class method exists" do
        expect(DataTableRow).to respond_to(:full_perspective)
      end

      it "detailed class method exists" do
        expect(DataTableRow).to respond_to(:detailed)
      end

      it "detailed requires data_table_id" do
        expect {
          DataTableRow.detailed({})
        }.to raise_error(RuntimeError, /'data_table_id' is required/)
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with allows read for everyone" do
        crud = DataTableRow.entity_crud
        expect(crud[:read]).to be_empty
      end
    end

    # Note: DataTableRow is a virtual model that uses DataTableEntity table
    # and generates dynamic columns based on DataTableColumn configurations.
    # Full testing requires data tables with entity data types and columns.
  end
end
