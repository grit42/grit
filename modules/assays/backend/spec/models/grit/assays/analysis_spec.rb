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
  RSpec.describe Analysis, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
    let(:sheet_def) { create(:grit_assays_assay_data_sheet_definition) }

    before do
      set_current_user(admin)
    end

    let(:analysis) do
      create(:grit_assays_analysis, assay_data_sheet_definition: sheet_def)
    end

    # --- Factories ---

    describe "factories" do
      it "creates a valid analysis" do
        expect(analysis).not_to be_nil
        expect(analysis.name).to be_present
        expect(analysis.assay_data_sheet_definition).to eq(sheet_def)
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to an assay_data_sheet_definition" do
        expect(analysis.assay_data_sheet_definition).to eq(sheet_def)
      end

      it "has many analysis_experiments" do
        published_status = create(:grit_core_publication_status, :published)
        experiment = Experiment.create!(
          name: "Exp for analysis",
          assay_model: sheet_def.assay_model,
          publication_status: published_status
        )
        ae = AnalysisExperiment.create!(analysis: analysis, experiment: experiment)
        expect(analysis.analysis_experiments).to include(ae)
      end
    end

    # --- Dependent destroy ---

    describe "dependent destroy" do
      it "destroys associated analysis_experiments when analysis is destroyed" do
        published_status = create(:grit_core_publication_status, :published)
        experiment = Experiment.create!(
          name: "Exp to destroy",
          assay_model: sheet_def.assay_model,
          publication_status: published_status
        )
        AnalysisExperiment.create!(analysis: analysis, experiment: experiment)
        expect { analysis.destroy }.to change(AnalysisExperiment, :count).by(-1)
      end
    end

    # --- entity_properties ---

    describe "entity_properties" do
      it "excludes plots and filters" do
        names = Analysis.entity_properties.map { |p| p[:name] }
        expect(names).not_to include("plots")
        expect(names).not_to include("filters")
      end

      it "includes name and description" do
        names = Analysis.entity_properties.map { |p| p[:name] }
        expect(names).to include("name")
        expect(names).to include("description")
      end
    end

    # --- entity_crud ---

    describe "entity_crud" do
      it "requires read:system to read" do
        expect(Analysis.entity_crud[:read]).to include("read:system")
      end

      it "requires write:analysis to write" do
        expect(Analysis.entity_crud[:write]).to include("write:analysis")
      end
    end
  end
end
