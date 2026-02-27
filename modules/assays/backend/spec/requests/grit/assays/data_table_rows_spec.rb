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


require "openapi_helper"

module Grit::Assays
  RSpec.describe "Data Table Rows API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

    before do
      Grit::Core::UserSession.create(admin)
      RequestStore.store["current_user"] = admin
    end

    let(:vocab) { Grit::Core::Vocabulary.create!(name: "Test Species") }
    let(:data_type) { vocab.data_type }
    let(:item1) { Grit::Core::VocabularyItem.create!(name: "Mouse", vocabulary: vocab) }
    let(:data_table) do
      dt = DataTable.create!(name: "Test Table", entity_data_type: data_type)
      DataTableEntity.create!(data_table_id: dt.id, entity_id: item1.id)
      dt
    end

    # --- Full Perspective ---

    describe "full_perspective" do
      before { login_as(admin) }

      it "returns row data for an entity" do
        get "/api/grit/assays/data_table_rows/#{item1.id}/full_perspective",
          params: { data_table_id: data_table.id, column_safe_name: "entity_name" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
      end

      it "includes experiment results for assay data sheet column" do
        draft_status = Grit::Core::PublicationStatus.find_or_create_by!(name: "Draft")
        published_status = Grit::Core::PublicationStatus.find_or_create_by!(name: "Published")
        integer_type = Grit::Core::DataType.find_or_create_by!(name: "integer") { |dt| dt.is_entity = false }
        assay_type = create(:grit_assays_assay_type, :biochemical)

        # 1. Draft assay model
        assay_model = AssayModel.new(name: "Test Species Assay", assay_type: assay_type)
        assay_model.publication_status = draft_status
        assay_model.save!

        # 2. Data sheet definition
        assay_def = AssayDataSheetDefinition.create!(
          name: "Test Results",
          result: true,
          sort: 1,
          assay_model: assay_model
        )

        # 3. Entity-link column
        AssayDataSheetColumn.create!(
          name: "Species",
          safe_name: "sp_id",
          sort: 1,
          required: true,
          assay_data_sheet_definition: assay_def,
          data_type: data_type
        )

        # 4. Measurement column
        measurement_col = AssayDataSheetColumn.create!(
          name: "IC50",
          safe_name: "ic_50_nm",
          sort: 2,
          required: false,
          assay_data_sheet_definition: assay_def,
          data_type: integer_type
        )

        # 5. Publish the assay model
        assay_model.publication_status = published_status
        assay_model.save!
        assay_model.create_tables

        # 6. Wire the measurement column into the data table
        DataTableColumn.create!(
          name: "IC50 (nM)",
          safe_name: "ic_50_nm",
          source_type: "assay_data_sheet_column",
          aggregation_method: "latest",
          experiment_ids: [],
          metadata_filters: {},
          data_table: data_table,
          assay_data_sheet_column: measurement_col
        )

        # 7. Draft experiment
        experiment = Experiment.new(name: "Test IC50 Experiment", assay_model: assay_model)
        experiment.publication_status = draft_status
        experiment.save!

        # 8. Add a second entity
        item2 = Grit::Core::VocabularyItem.create!(name: "Rat", vocabulary: vocab)
        DataTableEntity.create!(data_table_id: data_table.id, entity_id: item2.id)

        record_klass = ExperimentDataSheetRecord.sheet_record_klass(assay_def.id)
        record_klass.create!(experiment_id: experiment.id, sp_id: item1.id, ic_50_nm: 21)
        record_klass.create!(experiment_id: experiment.id, sp_id: item1.id, ic_50_nm: 42)
        record_klass.create!(experiment_id: experiment.id, sp_id: item2.id, ic_50_nm: 99)

        # 9. Publish experiment
        experiment.publication_status = published_status
        experiment.save!

        get "/api/grit/assays/data_table_rows/#{item1.id}/full_perspective",
          params: { data_table_id: data_table.id, column_safe_name: "ic_50_nm" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["total"]).to eq(1)
        row = json["data"].first
        expect(row["id"]).to eq(item1.id)
        expect(row["ic_50_nm"]).to eq(42)
        expect(row["experiment_id"]).to eq(experiment.id)
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/data_table_rows/0/full_perspective",
          params: { data_table_id: 0, column_safe_name: "entity_name" }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
