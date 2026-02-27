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
  RSpec.describe AssayType, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

    before do
      Grit::Core::UserSession.create(admin)
    end

    let(:assay_type) { create(:grit_assays_assay_type, :biochemical) }

    # --- Factories ---

    describe "factories" do
      it "creates records correctly" do
        expect(assay_type).not_to be_nil
        expect(assay_type.name).to eq("Biochemical")
        expect(create(:grit_assays_assay_type, :cellular)).not_to be_nil
        expect(create(:grit_assays_assay_type, :in_vivo)).not_to be_nil
      end
    end

    # --- Associations ---

    describe "associations" do
      it "has many assay_models" do
        expect(assay_type).to respond_to(:assay_models)
        expect(assay_type.assay_models).to be_a(ActiveRecord::Associations::CollectionProxy)
      end

      it "destroying assay_type destroys dependent assay_models" do
        at = AssayType.create!(name: "Test Type", description: "Test")
        model = AssayModel.create!(
          name: "Test Model",
          assay_type: at,
          publication_status: create(:grit_core_publication_status, :draft)
        )
        model_id = model.id

        at.destroy

        expect(AssayModel.exists?(model_id)).to be false
      end
    end

    # --- Validations ---

    describe "validations" do
      it "requires name" do
        at = AssayType.new(description: "Test")
        expect(at).not_to be_valid
        expect(at.errors[:name]).to include("can't be blank")
      end

      it "allows creation with valid attributes" do
        at = AssayType.new(name: "New Type", description: "A new assay type")
        expect(at).to be_valid
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = AssayType.entity_crud

        expect(crud[:create]).to include("Administrator")
        expect(crud[:create]).to include("AssayAdministrator")
        expect(crud[:update]).to include("Administrator")
        expect(crud[:update]).to include("AssayAdministrator")
        expect(crud[:destroy]).to include("Administrator")
        expect(crud[:destroy]).to include("AssayAdministrator")
        expect(crud[:read]).to be_empty
      end
    end
  end
end
