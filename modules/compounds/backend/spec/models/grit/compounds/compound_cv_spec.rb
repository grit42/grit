# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/compounds.
#
# @grit42/compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.

require "rails_helper"

Grit::Assays::ExperimentDataSheetRecord

module Grit::Compounds
  RSpec.describe Compound, type: :model do
    describe ".cv" do
      let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
      let(:published) { create(:grit_core_publication_status, :published) }
      let(:draft) { create(:grit_core_publication_status, :draft) }
      let(:decimal_type) { create(:grit_core_data_type, :decimal) }

      let(:compound_data_type) do
        create(:grit_core_data_type, :entity, name: "Compound", table_name: Compound.table_name)
      end

      let(:compound) { create(:grit_compounds_compound) }
      let(:unit) { create(:grit_core_unit) }
      let(:assay_type) { Grit::Assays::AssayType.create!(name: "Biochemical") }
      let(:assay_model) do
        Grit::Assays::AssayModel.create!(
          name: "Test Model", assay_type: assay_type, publication_status: draft
        )
      end

      let(:definition) do
        d = Grit::Assays::AssayDataSheetDefinition.create!(
          name: "Test Sheet", assay_model: assay_model, result: true, sort: 1
        )

        Grit::Assays::AssayDataSheetColumn.create!(
          name: "Compound", safe_name: "eos",
          assay_data_sheet_definition: d, data_type: compound_data_type, sort: 1
        )
        @value_column = Grit::Assays::AssayDataSheetColumn.create!(
          name: "IC50", safe_name: "ic50",
          assay_data_sheet_definition: d, data_type: decimal_type, unit: unit, sort: 2
        )

        d.reload
        d.create_table # create the dynamic ds_<id> table with the columns above
        assay_model.update!(publication_status: published)
        d
      end

      let(:experiment) do
        Grit::Assays::Experiment.create!(
          name: "Test Experiment", assay_model: assay_model, publication_status: published
        )
      end

      def insert_record(experiment_id:, compound_id:, ic50:)
        klass = Grit::Assays::ExperimentDataSheetRecord.sheet_record_klass(definition.id)
        klass.reset_column_information
        klass.create!(experiment_id: experiment_id, eos: compound_id, ic50: ic50)
      end

      before { set_current_user(admin) }

      after { definition.drop_table rescue nil }

      it "returns the compound's numeric assay values with assay-model/experiment/column/unit metadata" do
        insert_record(experiment_id: experiment.id, compound_id: compound.id, ic50: 42.5)

        rows = Compound.cv(compound_id: compound.id).to_a

        expect(rows.size).to eq(1)
        row = rows.first
        expect(row["value"]).to eq(42.5)
        expect(row["assay_model_id__name"]).to eq(assay_model.name)
        expect(row["experiment_id__name"]).to eq(experiment.name)
        expect(row["assay_data_sheet_definition_id__name"]).to eq(definition.name)
        expect(row["assay_data_sheet_column_id__name"]).to eq("IC50")
        expect(row["unit_id__abbreviation"]).to eq(unit.abbreviation)
      end

      it "excludes values from unpublished experiments" do
        draft = create(:grit_core_publication_status, :draft)
        draft_experiment = Grit::Assays::Experiment.create!(
          name: "Draft Experiment", assay_model: assay_model, publication_status: draft
        )
        insert_record(experiment_id: draft_experiment.id, compound_id: compound.id, ic50: 99.9)

        expect(Compound.cv(compound_id: compound.id).to_a).to be_empty
      end

      it "raises when compound_id is missing" do
        expect { Compound.cv }.to raise_error(/compound_id parameter is required/)
      end
    end
  end
end
