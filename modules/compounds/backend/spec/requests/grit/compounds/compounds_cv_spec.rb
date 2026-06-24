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

require "swagger_helper"

Grit::Assays::ExperimentDataSheetRecord
RSpec.describe "Grit::Compounds::Compound CV via index", type: :request do
  include AuthHelpers

  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:published) { create(:grit_core_publication_status, :published) }
  let(:draft) { create(:grit_core_publication_status, :draft) }
  let(:decimal_type) { create(:grit_core_data_type, :decimal) }
  let(:compound_data_type) do
    create(:grit_core_data_type, :entity, name: "Compound", table_name: Grit::Compounds::Compound.table_name)
  end
  let(:compound) { create(:grit_compounds_compound) }
  let(:unit) { create(:grit_core_unit) }
  let(:assay_type) { Grit::Assays::AssayType.create!(name: "Biochemical") }

  let(:assay_model) do
    Grit::Assays::AssayModel.create!(name: "Test Model", assay_type: assay_type, publication_status: draft)
  end

  # Two numeric value columns so cv emits two rows per record -> filtering by column name should
  # narrow the result from 2 rows to 1.
  let(:definition) do
    d = Grit::Assays::AssayDataSheetDefinition.create!(
      name: "Test Sheet", assay_model: assay_model, result: true, sort: 1
    )
    Grit::Assays::AssayDataSheetColumn.create!(
      name: "Compound", safe_name: "eos", assay_data_sheet_definition: d, data_type: compound_data_type, sort: 1
    )
    Grit::Assays::AssayDataSheetColumn.create!(
      name: "IC50", safe_name: "ic50", assay_data_sheet_definition: d, data_type: decimal_type, unit: unit, sort: 2
    )
    Grit::Assays::AssayDataSheetColumn.create!(
      name: "Inhibition", safe_name: "inhibition", assay_data_sheet_definition: d, data_type: decimal_type, sort: 3
    )
    d.reload
    d.create_table
    assay_model.update!(publication_status: published)
    d
  end

  let(:experiment) do
    Grit::Assays::Experiment.create!(name: "Test Experiment", assay_model: assay_model, publication_status: published)
  end

  before do
    login_as(admin)
    klass = Grit::Assays::ExperimentDataSheetRecord.sheet_record_klass(definition.id)
    klass.reset_column_information
    klass.create!(experiment_id: experiment.id, eos: compound.id, ic50: 42.5, inhibition: 88.0)
  end

  after { definition.drop_table rescue nil }

  def get_cv(filter: nil)
    params = { scope: "cv", compound_id: compound.id }
    params[:filter] = ActiveSupport::JSON.encode(filter) unless filter.nil?
    get "/api/grit/compounds/compounds", params: params
  end

  it "returns the compound's assay values (one row per numeric column)" do
    get_cv
    expect(response).to have_http_status(:success)
    data = JSON.parse(response.body)["data"]
    expect(data.length).to eq(2)
    expect(data.map { |r| r["assay_data_sheet_column_id__name"] }).to match_array(%w[IC50 Inhibition])
    ids = data.map { |r| r["id"] }
    expect(ids.uniq.length).to eq(ids.length)
  end

  it "filters by a cv column without erroring (regression: WHERE ( = '...') syntax error)" do
    get_cv(filter: [ { type: "string", operator: "eq", property: "assay_data_sheet_column_id__name", value: "IC50" } ])

    expect(response).to have_http_status(:success)
    data = JSON.parse(response.body)["data"]
    expect(data.length).to eq(1)
    expect(data[0]["assay_data_sheet_column_id__name"]).to eq("IC50")
    expect(data[0]["value"]).to eq(42.5)
    ids = data.map { |r| r["id"] }
    expect(ids.uniq.length).to eq(ids.length)
  end

  it "returns no rows when the filter matches nothing" do
    get_cv(filter: [ { type: "string", operator: "eq", property: "assay_data_sheet_column_id__name", value: "Nope" } ])

    expect(response).to have_http_status(:success)
    expect(JSON.parse(response.body)["data"]).to be_empty
  end
end
