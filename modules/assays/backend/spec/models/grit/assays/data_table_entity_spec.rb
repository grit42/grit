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
  RSpec.describe DataTableEntity, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

    before do
      Grit::Core::UserSession.create(admin)
    end

    # --- Basic Model Behavior ---

    describe "model behavior" do
      it "class exists and includes GritEntityRecord" do
        expect(defined?(DataTableEntity)).to be_truthy
        expect(DataTableEntity.include?(Grit::Core::GritEntityRecord)).to be true
      end
    end

    # --- Validations ---

    describe "validations" do
      it "entity_id must be unique within data_table" do
        validators = DataTableEntity.validators_on(:entity_id)
        uniqueness_validator = validators.find { |v| v.is_a?(ActiveRecord::Validations::UniquenessValidator) }

        expect(uniqueness_validator).not_to be_nil
        expect(uniqueness_validator.options[:scope]).to eq(:data_table_id)
      end
    end

    # --- Class Methods ---

    describe "class methods" do
      it "detailed class method exists" do
        expect(DataTableEntity).to respond_to(:detailed)
      end

      it "available class method exists" do
        expect(DataTableEntity).to respond_to(:available)
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = DataTableEntity.entity_crud

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

    # Note: DataTableEntity links entities to data tables. Full testing
    # requires data tables with entity data types pointing to real models.
  end
end
