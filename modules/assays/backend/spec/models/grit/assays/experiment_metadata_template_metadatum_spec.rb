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
  RSpec.describe ExperimentMetadataTemplateMetadatum, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:vocabulary) { create(:grit_core_vocabulary) }
    let(:vocab_item_one) { create(:grit_core_vocabulary_item, vocabulary: vocabulary) }
    let(:vocab_item_two) { create(:grit_core_vocabulary_item, vocabulary: vocabulary) }

    let(:species_def) do
      create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
    end

    let(:tissue_type_def) do
      create(:grit_assays_assay_metadata_definition, :tissue_type, vocabulary: vocabulary)
    end

    before do
      Grit::Core::UserSession.create(admin)
    end

    # --- Basic Model Behavior ---

    describe "model behavior" do
      it "class exists and includes GritEntityRecord" do
        expect(defined?(ExperimentMetadataTemplateMetadatum)).to be_truthy
        expect(ExperimentMetadataTemplateMetadatum.include?(Grit::Core::GritEntityRecord)).to be true
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to assay_metadata_definition" do
        expect(ExperimentMetadataTemplateMetadatum.reflect_on_association(:assay_metadata_definition)).to be_present
        expect(ExperimentMetadataTemplateMetadatum.reflect_on_association(:assay_metadata_definition).macro).to eq(:belongs_to)
      end

      it "belongs to experiment_metadata_template" do
        expect(ExperimentMetadataTemplateMetadatum.reflect_on_association(:experiment_metadata_template)).to be_present
        expect(ExperimentMetadataTemplateMetadatum.reflect_on_association(:experiment_metadata_template).macro).to eq(:belongs_to)
      end

      it "belongs to vocabulary" do
        expect(ExperimentMetadataTemplateMetadatum.reflect_on_association(:vocabulary)).to be_present
        expect(ExperimentMetadataTemplateMetadatum.reflect_on_association(:vocabulary).macro).to eq(:belongs_to)
      end

      it "belongs to vocabulary_item" do
        expect(ExperimentMetadataTemplateMetadatum.reflect_on_association(:vocabulary_item)).to be_present
        expect(ExperimentMetadataTemplateMetadatum.reflect_on_association(:vocabulary_item).macro).to eq(:belongs_to)
      end
    end

    # --- after_destroy callback ---

    describe "after_destroy callback" do
      it "destroying last metadatum destroys the template" do
        template = ExperimentMetadataTemplate.create!(
          name: "Destroy Callback Template",
          description: "Template for destroy callback test"
        )

        template.set_metadata_values(species_def.safe_name => vocab_item_one.id)
        template.reload

        metadatum = template.experiment_metadata_template_metadata.order(:id).first
        expect(metadatum).not_to be_nil

        template_id = template.id

        metadatum.destroy

        expect(ExperimentMetadataTemplate.exists?(template_id)).to be false
      end

      it "destroying one metadatum does not destroy template with remaining metadata" do
        template = ExperimentMetadataTemplate.create!(
          name: "Multiple Metadata Template",
          description: "Template with multiple metadata"
        )

        template.set_metadata_values(
          species_def.safe_name => vocab_item_one.id,
          tissue_type_def.safe_name => vocab_item_two.id
        )
        template.reload

        expect(template.experiment_metadata_template_metadata.count).to eq(2)

        species_metadatum = template.experiment_metadata_template_metadata.find_by(
          assay_metadata_definition: species_def
        )
        species_metadatum.destroy

        expect(ExperimentMetadataTemplate.exists?(template.id)).to be true
        expect(template.reload.experiment_metadata_template_metadata.count).to eq(1)

        template.destroy
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = ExperimentMetadataTemplateMetadatum.entity_crud

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
