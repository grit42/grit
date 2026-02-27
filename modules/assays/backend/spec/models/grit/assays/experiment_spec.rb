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
  RSpec.describe Experiment, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:draft_status) { create(:grit_core_publication_status, :draft) }
    let(:published_status) { create(:grit_core_publication_status, :published) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }
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
      exp = Experiment.create!(
        name: "Draft Kinase Experiment 001",
        assay_model: draft_model,
        publication_status: draft_status
      )
      # Link species metadata
      AssayModelMetadatum.create!(assay_model: draft_model, assay_metadata_definition: species_def)
      ExperimentMetadatum.create!(
        experiment: exp,
        assay_metadata_definition: species_def,
        vocabulary: vocabulary,
        vocabulary_item: vocab_item_one
      )
      exp
    end

    let(:published_experiment) do
      pub_model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
      # Link both metadata defs
      AssayModelMetadatum.create!(assay_model: pub_model, assay_metadata_definition: species_def)
      AssayModelMetadatum.create!(assay_model: pub_model, assay_metadata_definition: tissue_type_def)

      exp = Experiment.create!(
        name: "Published Viability Experiment 001",
        assay_model: pub_model,
        publication_status: published_status
      )
      ExperimentMetadatum.create!(
        experiment: exp,
        assay_metadata_definition: species_def,
        vocabulary: vocabulary,
        vocabulary_item: vocab_item_one
      )
      ExperimentMetadatum.create!(
        experiment: exp,
        assay_metadata_definition: tissue_type_def,
        vocabulary: vocabulary,
        vocabulary_item: vocab_item_two
      )
      exp
    end

    before do
      set_current_user(admin)
    end

    # --- Factories ---

    describe "factories" do
      it "creates records correctly" do
        expect(draft_experiment).not_to be_nil
        expect(published_experiment).not_to be_nil
        expect(draft_experiment.name).to eq("Draft Kinase Experiment 001")
        expect(published_experiment.name).to eq("Published Viability Experiment 001")
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to assay_model" do
        expect(draft_experiment.assay_model).to eq(draft_model)
      end

      it "belongs to publication_status" do
        expect(draft_experiment.publication_status.name).to eq("Draft")
        expect(published_experiment.publication_status.name).to eq("Published")
      end

      it "has many experiment_metadata" do
        expect(draft_experiment).to respond_to(:experiment_metadata)
        expect(draft_experiment.experiment_metadata.count).to eq(1)
        expect(published_experiment.experiment_metadata.count).to eq(2)
      end
    end

    # --- Validations ---

    describe "validations" do
      it "requires name" do
        experiment = Experiment.new(
          assay_model: draft_model,
          publication_status: draft_status
        )
        expect(experiment).not_to be_valid
        expect(experiment.errors[:name]).to include("can't be blank")
      end

      it "requires assay_model" do
        experiment = Experiment.new(
          name: "Test Experiment",
          publication_status: draft_status
        )
        expect(experiment).not_to be_valid
        expect(experiment.errors[:assay_model]).to include("must exist")
      end
    end

    # --- Publication Status Callback ---

    describe "publication status callbacks" do
      it "draft experiment can be modified" do
        draft_experiment.description = "Updated description"
        expect(draft_experiment.save).to be true
        expect(draft_experiment.reload.description).to eq("Updated description")
      end

      it "published experiment cannot be modified" do
        experiment = Experiment.find(published_experiment.id)

        expect {
          experiment.update!(description: "Cannot change this")
        }.to raise_error(RuntimeError, /Cannot modify a published Experiment/)
      end

      it "published experiment can change publication_status" do
        published_experiment.publication_status = draft_status
        expect(published_experiment.save).to be true
      end
    end

    # --- set_metadata_values ---

    describe "#set_metadata_values" do
      it "creates new metadata" do
        experiment = Experiment.create!(
          name: "Metadata Test Experiment",
          assay_model: draft_model,
          publication_status: draft_status
        )
        # Ensure model has species metadata def linked
        AssayModelMetadatum.find_or_create_by!(assay_model: draft_model, assay_metadata_definition: species_def)

        result = experiment.set_metadata_values(species_def.safe_name => vocab_item_one.id)

        expect(result).to be_truthy
        experiment.reload
        metadata = experiment.experiment_metadata.find_by(assay_metadata_definition: species_def)
        expect(metadata).not_to be_nil
        expect(metadata.vocabulary_item_id).to eq(vocab_item_one.id)
      end

      it "updates existing metadata" do
        # Use draft_experiment which already has species metadata
        original_metadata = draft_experiment.experiment_metadata.find_by(
          assay_metadata_definition: species_def
        )
        expect(original_metadata).not_to be_nil
        original_item_id = original_metadata.vocabulary_item_id

        result = draft_experiment.set_metadata_values(species_def.safe_name => vocab_item_two.id)

        expect(result).to be_truthy
        draft_experiment.reload
        updated_metadata = draft_experiment.experiment_metadata.find_by(
          assay_metadata_definition: species_def
        )
        expect(updated_metadata.vocabulary_item_id).to eq(vocab_item_two.id)
        expect(updated_metadata.vocabulary_item_id).not_to eq(original_item_id)
      end

      it "removes metadata when value is blank" do
        expect(draft_experiment.experiment_metadata.exists?(assay_metadata_definition: species_def)).to be true

        result = draft_experiment.set_metadata_values(species_def.safe_name => "")

        expect(result).to be_truthy
        draft_experiment.reload
        expect(draft_experiment.experiment_metadata.exists?(assay_metadata_definition: species_def)).to be false
      end

      it "handles nil values" do
        expect(draft_experiment.experiment_metadata.exists?(assay_metadata_definition: species_def)).to be true

        result = draft_experiment.set_metadata_values(species_def.safe_name => nil)

        expect(result).to be_truthy
        draft_experiment.reload
        expect(draft_experiment.experiment_metadata.exists?(assay_metadata_definition: species_def)).to be false
      end
    end

    # --- Detailed Scope ---

    describe ".detailed" do
      it "includes publication status" do
        result = Experiment.detailed.find(draft_experiment.id)
        expect(result).to respond_to(:publication_status_id__name)
        expect(result.publication_status_id__name).to eq("Draft")
      end

      it "includes assay model info" do
        result = Experiment.detailed.find(draft_experiment.id)
        expect(result).to respond_to(:assay_model_id__name)
        expect(result.assay_model_id__name).to eq(draft_model.name)
      end

      it "includes assay type info" do
        result = Experiment.detailed.find(draft_experiment.id)
        expect(result).to respond_to(:assay_type_id__name)
        expect(result.assay_type_id__name).to eq(biochemical.name)
      end

      it "includes metadata values" do
        result = Experiment.detailed.find(draft_experiment.id)
        expect(result).to respond_to(species_def.safe_name.to_sym)
      end
    end

    # --- delete_records ---

    describe "#delete_records" do
      it "removes records from dynamic tables" do
        model = AssayModel.create!(
          name: "Delete Records Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Delete Records Test Sheet",
          assay_model: model,
          result: true, sort: 1
        )

        AssayDataSheetColumn.create!(
          name: "Value", safe_name: "value",
          assay_data_sheet_definition: sheet, data_type: integer_type,
          sort: 1, required: false
        )

        sheet.reload
        sheet.create_table

        experiment = Experiment.create!(
          name: "Delete Records Test Experiment",
          assay_model: model,
          publication_status: draft_status
        )

        klass = sheet.sheet_record_klass
        klass.reset_column_information
        klass.create!(experiment_id: experiment.id, value: 42)

        expect(klass.where(experiment_id: experiment.id).count).to eq(1)

        experiment.delete_records

        expect(klass.where(experiment_id: experiment.id).count).to eq(0)

        sheet.drop_table
        Experiment.delete(experiment.id)
        model.destroy
      end
    end

    # --- before_destroy Callbacks ---

    describe "before_destroy callbacks" do
      it "removes records from dynamic tables" do
        model = AssayModel.create!(
          name: "Destroy Experiment Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Destroy Experiment Test Sheet",
          assay_model: model,
          result: true, sort: 1
        )

        AssayDataSheetColumn.create!(
          name: "Value", safe_name: "value",
          assay_data_sheet_definition: sheet, data_type: integer_type,
          sort: 1, required: false
        )

        sheet.reload
        sheet.create_table

        experiment = Experiment.create!(
          name: "Destroy Experiment Test",
          assay_model: model,
          publication_status: draft_status
        )

        klass = sheet.sheet_record_klass
        klass.reset_column_information
        klass.create!(experiment_id: experiment.id, value: 123)
        expect(klass.count).to eq(1)

        experiment.destroy

        expect(klass.where(experiment_id: experiment.id).count).to eq(0)

        sheet.drop_table
        model.destroy
      end
    end

    # --- Dependent Destroy ---

    describe "dependent destroy" do
      it "destroying experiment destroys dependent metadata" do
        experiment = Experiment.create!(
          name: "Dependent Metadata Test",
          assay_model: draft_model,
          publication_status: draft_status
        )

        metadata = ExperimentMetadatum.create!(
          experiment: experiment,
          assay_metadata_definition: species_def,
          vocabulary: species_def.vocabulary,
          vocabulary_item: vocab_item_one
        )

        metadata_id = metadata.id

        experiment.destroy

        expect(ExperimentMetadatum.exists?(metadata_id)).to be false
      end
    end

    # --- Entity Properties ---

    describe ".entity_properties" do
      it "excludes plots field" do
        properties = Experiment.entity_properties
        property_names = properties.map { |p| p[:name] }
        expect(property_names).not_to include("plots")
      end
    end

    # --- Metadata Properties ---

    describe ".metadata_properties" do
      before do
        # Ensure model has both metadata defs linked
        AssayModelMetadatum.find_or_create_by!(assay_model: draft_model, assay_metadata_definition: species_def)
        AssayModelMetadatum.find_or_create_by!(assay_model: draft_model, assay_metadata_definition: tissue_type_def)
      end

      it "returns metadata definitions" do
        properties = Experiment.metadata_properties(assay_model_id: draft_model.id)

        expect(properties).to be_an(Array)
        property_names = properties.map { |p| p[:name] }
        expect(property_names).to include("species")
        expect(property_names).to include("tissue_type")
      end

      it "marks required metadata based on assay model" do
        properties = Experiment.metadata_properties(assay_model_id: draft_model.id)

        species_prop = properties.find { |p| p[:name] == "species" }
        expect(species_prop).not_to be_nil
        expect(species_prop[:required]).to be true
      end
    end
  end
end
