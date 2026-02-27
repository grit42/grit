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
  RSpec.describe AssayMetadataDefinition, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:vocabulary) { create(:grit_core_vocabulary) }
    let(:draft_status) { create(:grit_core_publication_status, :draft) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }

    before do
      set_current_user(admin)
    end

    let(:species) do
      create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
    end

    let(:tissue_type) do
      create(:grit_assays_assay_metadata_definition, :tissue_type, vocabulary: vocabulary)
    end

    # --- Factories ---

    describe "factories" do
      it "creates records correctly" do
        expect(species).not_to be_nil
        expect(tissue_type).not_to be_nil
        expect(species.name).to eq("Species")
        expect(species.safe_name).to eq("species")
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to vocabulary" do
        expect(species.vocabulary).to eq(vocabulary)
      end

      it "has many experiment_metadata" do
        expect(species).to respond_to(:experiment_metadata)
        expect(species.experiment_metadata).to be_a(ActiveRecord::Associations::CollectionProxy)
      end

      it "has many experiment_metadata_template_metadata" do
        expect(species).to respond_to(:experiment_metadata_template_metadata)
        expect(species.experiment_metadata_template_metadata).to be_a(ActiveRecord::Associations::CollectionProxy)
      end
    end

    # --- Validations ---

    describe "validations" do
      it "requires safe_name to be unique" do
        species # create first
        definition = AssayMetadataDefinition.new(
          name: "Duplicate Safe Name",
          safe_name: species.safe_name,
          vocabulary: vocabulary
        )
        expect(definition).not_to be_valid
        expect(definition.errors[:safe_name]).to include("has already been taken")
      end

      it "safe_name cannot conflict with Experiment methods" do
        definition = AssayMetadataDefinition.new(
          name: "Name Conflict",
          safe_name: "name",
          vocabulary: vocabulary
        )
        expect(definition).not_to be_valid
        expect(definition.errors[:safe_name].any? { |e| e.include?("cannot be used") }).to be true
      end

      it "allows creation with valid attributes" do
        definition = AssayMetadataDefinition.new(
          name: "Valid Definition",
          safe_name: "valid_definition",
          description: "A valid metadata definition",
          vocabulary: vocabulary
        )
        expect(definition).to be_valid
      end
    end

    # --- Callbacks ---

    describe "callbacks" do
      it "cannot modify metadata definition in use by assay model" do
        draft_model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
        AssayModelMetadatum.create!(
          assay_model: draft_model,
          assay_metadata_definition: species
        )

        expect {
          species.update!(name: "Changed Species")
        }.to raise_error(RuntimeError)
      end

      it "cannot destroy metadata definition required in assay model" do
        draft_model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
        AssayModelMetadatum.create!(
          assay_model: draft_model,
          assay_metadata_definition: species
        )

        expect {
          species.destroy!
        }.to raise_error(RuntimeError)
      end
    end

    # --- by_assay_model scope ---

    describe ".by_assay_model" do
      it "returns metadata for specific assay model" do
        draft_model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
        AssayModelMetadatum.create!(
          assay_model: draft_model,
          assay_metadata_definition: species
        )

        result = AssayMetadataDefinition.by_assay_model("assay_model_id" => draft_model.id)

        expect(result).not_to be_empty
        safe_names = result.map(&:safe_name)
        expect(safe_names).to include("species")
      end

      it "raises error without assay_model_id" do
        expect {
          AssayMetadataDefinition.by_assay_model({})
        }.to raise_error(RuntimeError)
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = AssayMetadataDefinition.entity_crud

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
