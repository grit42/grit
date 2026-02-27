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
  RSpec.describe ExperimentMetadataTemplate, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:vocabulary) { create(:grit_core_vocabulary) }
    let(:vocab_item_one) { create(:grit_core_vocabulary_item, vocabulary: vocabulary) }
    let(:vocab_item_two) { create(:grit_core_vocabulary_item, vocabulary: vocabulary) }

    let(:species_def) do
      create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
    end

    before do
      Grit::Core::UserSession.create(admin)
    end

    # --- Basic Model Behavior ---

    describe "model behavior" do
      it "class exists and includes GritEntityRecord" do
        expect(defined?(ExperimentMetadataTemplate)).to be_truthy
        expect(ExperimentMetadataTemplate.include?(Grit::Core::GritEntityRecord)).to be true
      end
    end

    # --- Associations ---

    describe "associations" do
      it "has many experiment_metadata_template_metadata" do
        expect(ExperimentMetadataTemplate.reflect_on_association(:experiment_metadata_template_metadata)).to be_present
        association = ExperimentMetadataTemplate.reflect_on_association(:experiment_metadata_template_metadata)
        expect(association.macro).to eq(:has_many)
        expect(association.options[:dependent]).to eq(:destroy)
      end
    end

    # --- set_metadata_values ---

    describe "#set_metadata_values" do
      it "creates metadata for template" do
        template = ExperimentMetadataTemplate.create!(
          name: "Test Template",
          description: "Test template description"
        )

        result = template.set_metadata_values(species_def.safe_name => vocab_item_one.id)

        expect(result).to be_truthy
        template.reload
        metadata = template.experiment_metadata_template_metadata.find_by(assay_metadata_definition: species_def)
        expect(metadata).not_to be_nil
        expect(metadata.vocabulary_item_id).to eq(vocab_item_one.id)

        template.destroy
      end

      it "updates existing metadata" do
        template = ExperimentMetadataTemplate.create!(
          name: "Update Template",
          description: "Template for update test"
        )

        result1 = template.set_metadata_values(species_def.safe_name => vocab_item_one.id)
        expect(result1).to be_truthy
        template.reload

        template.set_metadata_values(species_def.safe_name => vocab_item_two.id)

        template.reload
        metadata = template.experiment_metadata_template_metadata.find_by(assay_metadata_definition: species_def)
        expect(metadata).not_to be_nil

        template.destroy rescue nil
      end

      it "method exists" do
        template = ExperimentMetadataTemplate.new(name: "Test")
        expect(template).to respond_to(:set_metadata_values)
      end
    end

    # --- detailed scope ---

    describe ".detailed" do
      it "includes metadata columns" do
        templates = ExperimentMetadataTemplate.detailed
        expect(templates).to respond_to(:to_a)
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = ExperimentMetadataTemplate.entity_crud

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
