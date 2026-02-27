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
  RSpec.describe AssayModelMetadatum, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:draft_status) { create(:grit_core_publication_status, :draft) }
    let(:published_status) { create(:grit_core_publication_status, :published) }
    let(:vocabulary) { create(:grit_core_vocabulary) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }

    let(:draft_model) do
      create(:grit_assays_assay_model, :draft, assay_type: biochemical)
    end

    let(:published_model) do
      create(:grit_assays_assay_model, :published, assay_type: biochemical)
    end

    let(:species_def) do
      create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
    end

    let(:draft_model_species) do
      AssayModelMetadatum.create!(
        assay_model: draft_model,
        assay_metadata_definition: species_def
      )
    end

    before do
      Grit::Core::UserSession.create(admin)
    end

    # --- Factories ---

    describe "factories" do
      it "creates records correctly" do
        expect(draft_model_species).not_to be_nil
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to assay_metadata_definition" do
        expect(draft_model_species.assay_metadata_definition).to eq(species_def)
      end

      it "belongs to assay_model" do
        expect(draft_model_species.assay_model).to eq(draft_model)
      end
    end

    # --- Callbacks ---

    describe "callbacks" do
      it "has before_save callbacks configured" do
        callbacks = AssayModelMetadatum._save_callbacks.select { |c| c.kind == :before }
        expect(callbacks).not_to be_empty
      end

      it "associations are configured" do
        expect(AssayModelMetadatum.reflect_on_association(:assay_metadata_definition)).to be_present
        expect(AssayModelMetadatum.reflect_on_association(:assay_model)).to be_present
      end

      it "cannot create metadata link on published assay model" do
        definition = AssayMetadataDefinition.create!(
          name: "New Definition",
          safe_name: "new_definition",
          vocabulary: vocabulary
        )

        expect {
          AssayModelMetadatum.create!(
            assay_model: published_model,
            assay_metadata_definition: definition
          )
        }.to raise_error(RuntimeError)

        definition.destroy
      end

      it "can create metadata link on draft assay model" do
        definition = AssayMetadataDefinition.create!(
          name: "Another Definition",
          safe_name: "another_def",
          vocabulary: vocabulary
        )

        link = AssayModelMetadatum.new(
          assay_model: draft_model,
          assay_metadata_definition: definition
        )

        expect(link.save).to be true

        link.destroy
        definition.destroy
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = AssayModelMetadatum.entity_crud

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
