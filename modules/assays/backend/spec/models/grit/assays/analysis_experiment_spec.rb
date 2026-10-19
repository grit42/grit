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
  RSpec.describe AnalysisExperiment, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
    let(:draft_status) { create(:grit_core_publication_status, :draft) }
    let(:published_status) { create(:grit_core_publication_status, :published) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }

    let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }
    let(:sheet_def) { create(:grit_assays_assay_data_sheet_definition, assay_model: draft_model) }
    let(:analysis) { create(:grit_assays_analysis, assay_data_sheet_definition: sheet_def) }

    let(:published_experiment) do
      Experiment.create!(
        name: "Published Exp",
        assay_model: draft_model,
        publication_status: published_status
      )
    end

    let(:draft_experiment) do
      Experiment.create!(
        name: "Draft Exp",
        assay_model: draft_model,
        publication_status: draft_status
      )
    end

    before do
      set_current_user(admin)
    end

    # --- Factories ---

    describe "factories" do
      it "creates a valid analysis_experiment" do
        ae = create(:grit_assays_analysis_experiment, analysis: analysis, experiment: published_experiment)
        expect(ae).not_to be_nil
        expect(ae.analysis).to eq(analysis)
        expect(ae.experiment).to eq(published_experiment)
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to an analysis" do
        ae = AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)
        expect(ae.analysis).to eq(analysis)
      end

      it "belongs to an experiment" do
        ae = AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)
        expect(ae.experiment).to eq(published_experiment)
      end
    end

    # --- Uniqueness ---

    describe "uniqueness" do
      it "prevents duplicate [analysis_id, experiment_id] pairs" do
        AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)
        expect {
          AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    # --- .selected_experiments ---

    describe ".selected_experiments" do
      it "returns experiments linked to the analysis" do
        unrelated_experiment = Experiment.create!(
          name: "Unrelated Exp",
          assay_model: draft_model,
          publication_status: published_status
        )
        AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)
        result = AnalysisExperiment.selected_experiments(analysis_id: analysis.id)
        expect(result.map(&:id)).to include(published_experiment.id)
        expect(result.map(&:id)).not_to include(unrelated_experiment.id)
      end

      it "includes experiment_analysis_id in the select" do
        ae = AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)
        result = AnalysisExperiment.selected_experiments(analysis_id: analysis.id)
        expect(result.first.experiment_analysis_id).to eq(ae.id)
      end

      it "does not return experiments from other analyses" do
        other_sheet = create(:grit_assays_assay_data_sheet_definition, assay_model: draft_model)
        other_analysis = create(:grit_assays_analysis, assay_data_sheet_definition: other_sheet)
        other_experiment = Experiment.create!(
          name: "Other Exp",
          assay_model: draft_model,
          publication_status: published_status
        )
        AnalysisExperiment.create!(analysis: other_analysis, experiment: other_experiment)

        result = AnalysisExperiment.selected_experiments(analysis_id: analysis.id)
        expect(result.map(&:id)).not_to include(other_experiment.id)
      end
    end

    # --- .available_experiments ---

    describe ".available_experiments" do
      it "returns published experiments not yet linked to the analysis" do
        published_experiment # ensure created before querying
        result = AnalysisExperiment.available_experiments(analysis_id: analysis.id)
        expect(result.map(&:id)).to include(published_experiment.id)
      end

      it "excludes draft experiments" do
        draft_experiment
        result = AnalysisExperiment.available_experiments(analysis_id: analysis.id)
        expect(result.map(&:id)).not_to include(draft_experiment.id)
      end

      it "excludes experiments already linked to the analysis" do
        AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)
        result = AnalysisExperiment.available_experiments(analysis_id: analysis.id)
        expect(result.map(&:id)).not_to include(published_experiment.id)
      end

      it "excludes published experiments whose assay model does not share the analysis data sheet definition" do
        other_model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
        unrelated_experiment = Experiment.create!(
          name: "Unrelated Exp",
          assay_model: other_model,
          publication_status: published_status
        )
        result = AnalysisExperiment.available_experiments(analysis_id: analysis.id)
        expect(result.map(&:id)).not_to include(unrelated_experiment.id)
      end
    end
  end
end
