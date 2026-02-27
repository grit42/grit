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
  RSpec.describe ExperimentMetadatum, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:draft_status) { create(:grit_core_publication_status, :draft) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:vocabulary) { create(:grit_core_vocabulary) }
    let(:vocab_item_one) { create(:grit_core_vocabulary_item, vocabulary: vocabulary) }
    let(:vocab_item_two) { create(:grit_core_vocabulary_item, vocabulary: vocabulary) }

    let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }

    let(:species_def) do
      create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
    end

    let(:tissue_type_def) do
      create(:grit_assays_assay_metadata_definition, :tissue_type, vocabulary: vocabulary)
    end

    let(:draft_experiment) do
      Experiment.create!(
        name: "Draft Experiment",
        assay_model: draft_model,
        publication_status: draft_status
      )
    end

    let(:draft_experiment_species) do
      ExperimentMetadatum.create!(
        experiment: draft_experiment,
        assay_metadata_definition: species_def,
        vocabulary: vocabulary,
        vocabulary_item: vocab_item_one
      )
    end

    before do
      set_current_user(admin)
    end

    # --- Factories ---

    describe "factories" do
      it "creates records correctly" do
        expect(draft_experiment_species).not_to be_nil
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to assay_metadata_definition" do
        expect(draft_experiment_species.assay_metadata_definition).to eq(species_def)
      end

      it "belongs to experiment" do
        expect(draft_experiment_species.experiment).to eq(draft_experiment)
      end

      it "belongs to vocabulary" do
        expect(draft_experiment_species.vocabulary).to eq(vocabulary)
      end

      it "belongs to vocabulary_item" do
        expect(draft_experiment_species.vocabulary_item).to eq(vocab_item_one)
      end
    end

    # --- Validations ---

    describe "validations" do
      it "requires experiment" do
        metadata = ExperimentMetadatum.new(
          assay_metadata_definition: species_def,
          vocabulary: vocabulary,
          vocabulary_item: vocab_item_one
        )
        expect(metadata).not_to be_valid
        expect(metadata.errors[:experiment]).to include("must exist")
      end

      it "requires assay_metadata_definition" do
        metadata = ExperimentMetadatum.new(
          experiment: draft_experiment,
          vocabulary: vocabulary,
          vocabulary_item: vocab_item_one
        )
        expect(metadata).not_to be_valid
        expect(metadata.errors[:assay_metadata_definition]).to include("must exist")
      end

      it "requires vocabulary" do
        metadata = ExperimentMetadatum.new(
          experiment: draft_experiment,
          assay_metadata_definition: tissue_type_def,
          vocabulary_item: vocab_item_one
        )
        expect(metadata).not_to be_valid
        expect(metadata.errors[:vocabulary]).to include("must exist")
      end

      it "requires vocabulary_item" do
        metadata = ExperimentMetadatum.new(
          experiment: draft_experiment,
          assay_metadata_definition: tissue_type_def,
          vocabulary: vocabulary
        )
        expect(metadata).not_to be_valid
        expect(metadata.errors[:vocabulary_item]).to include("must exist")
      end

      it "allows creation with valid attributes" do
        experiment = Experiment.create!(
          name: "Metadata Test Experiment",
          assay_model: draft_model,
          publication_status: draft_status
        )

        metadata = ExperimentMetadatum.new(
          experiment: experiment,
          assay_metadata_definition: tissue_type_def,
          vocabulary: vocabulary,
          vocabulary_item: vocab_item_two
        )
        expect(metadata).to be_valid

        experiment.destroy
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = ExperimentMetadatum.entity_crud

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
  end
end
