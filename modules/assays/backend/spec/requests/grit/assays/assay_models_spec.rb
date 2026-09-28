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


require "swagger_helper"

module Grit::Assays
  RSpec.describe "Assay Models API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }

    before do
      set_current_user(admin)
    end

    path "/api/grit/assays/assay_models" do
      get "Lists all assay models" do
        tags "Assays - Assay Models"
        produces "application/json"
        security [ { bearer_auth: [] } ]

        response "200", "assay models listed" do
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end

      post "Creates an assay model" do
        tags "Assays - Assay Models"
        consumes "application/json"
        produces "application/json"
        security [ { bearer_auth: [] } ]
        parameter name: :params, in: :body, schema: { type: :object }

        response "201", "assay model created with minimal params" do
          before { login_as(admin) }

          let(:params) do
            { name: "New Test Assay", assay_type_id: biochemical.id }
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["name"]).to eq("New Test Assay")
          end
        end

        response "422", "assay model not created without name" do
          before { login_as(admin) }

          let(:params) { { assay_type_id: biochemical.id } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be false
          end
        end
      end
    end

    path "/api/grit/assays/assay_models/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "Shows an assay model" do
        tags "Assays - Assay Models"
        produces "application/json"
        security [ { bearer_auth: [] } ]

        response "200", "assay model shown" do
          let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }
          let(:id) { draft_model.id }
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["id"]).to eq(draft_model.id)
          end
        end
      end

      patch "Updates a draft assay model" do
        tags "Assays - Assay Models"
        consumes "application/json"
        produces "application/json"
        security [ { bearer_auth: [] } ]
        parameter name: :params, in: :body, schema: { type: :object }

        response "200", "assay model updated" do
          let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }
          let(:id) { draft_model.id }
          before { login_as(admin) }

          let(:params) { { name: "Updated Draft Name" } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(draft_model.reload.name).to eq("Updated Draft Name")
          end
        end
      end

      delete "Destroys a draft assay model" do
        tags "Assays - Assay Models"
        produces "application/json"
        security [ { bearer_auth: [] } ]

        response "200", "assay model destroyed" do
          before { login_as(admin) }

          let(:id) do
            post "/api/grit/assays/assay_models",
              params: { name: "To Be Destroyed", assay_type_id: biochemical.id },
              as: :json
            JSON.parse(response.body)["data"]["id"]
          end

          run_test!
        end
      end
    end

    # --- Create with sheets and columns ---

    describe "create with sheets and columns" do
      before { login_as(admin) }

      it "creates assay_model with sheets and columns" do
        expect {
          post "/api/grit/assays/assay_models", params: {
            name: "Assay With Sheets",
            assay_type_id: biochemical.id,
            sheets: [
              {
                name: "Results Sheet",
                result: true,
                sort: 1,
                columns: [
                  {
                    name: "IC50",
                    safe_name: "ic50",
                    sort: 1,
                    required: false,
                    data_type_id: integer_type.id
                  }
                ]
              }
            ]
          }, as: :json
        }.to change(AssayModel, :count).by(1)
          .and change(AssayDataSheetDefinition, :count).by(1)
          .and change(AssayDataSheetColumn, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
      end

      it "newly created assay_model has draft publication status" do
        post "/api/grit/assays/assay_models", params: {
          name: "Draft Status Check",
          assay_type_id: biochemical.id
        }, as: :json

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        created = AssayModel.find(json["data"]["id"])
        expect(created.publication_status.name).to eq("Draft")
      end
    end

    # --- Publish ---

    describe "publish" do
      before { login_as(admin) }

      it "publishes a draft assay_model" do
        post "/api/grit/assays/assay_models", params: {
          name: "To Be Published",
          assay_type_id: biochemical.id,
          sheets: [ { name: "Results", result: true, sort: 1, columns: [] } ]
        }, as: :json
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]
        sheet = AssayDataSheetDefinition.find_by(assay_model_id: model_id)

        post "/api/grit/assays/assay_models/#{model_id}/publish", as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(AssayModel.find(model_id).publication_status.name).to eq("Published")
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be true

        # Clean up dynamic tables via draft action
        post "/api/grit/assays/assay_models/#{model_id}/draft", as: :json
      end

      it "publish creates dynamic tables for each sheet" do
        post "/api/grit/assays/assay_models", params: {
          name: "Publish Table Creation Test",
          assay_type_id: biochemical.id,
          sheets: [
            { name: "Sheet 1", result: true, sort: 1, columns: [] },
            { name: "Sheet 2", result: false, sort: 2, columns: [] }
          ]
        }, as: :json
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]
        sheets = AssayDataSheetDefinition.where(assay_model_id: model_id).order(:sort)

        post "/api/grit/assays/assay_models/#{model_id}/publish", as: :json

        expect(response).to have_http_status(:success)
        expect(ActiveRecord::Base.connection.table_exists?(sheets.first.table_name)).to be true
        expect(ActiveRecord::Base.connection.table_exists?(sheets.second.table_name)).to be true

        # Clean up
        post "/api/grit/assays/assay_models/#{model_id}/draft", as: :json
      end
    end

    # --- Draft (unpublish) ---

    describe "draft (unpublish)" do
      before { login_as(admin) }

      it "moves published assay_model back to draft" do
        post "/api/grit/assays/assay_models", params: {
          name: "To Be Drafted",
          assay_type_id: biochemical.id,
          sheets: [ { name: "Sheet", result: true, sort: 1, columns: [] } ]
        }, as: :json
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]
        sheet = AssayDataSheetDefinition.find_by(assay_model_id: model_id)

        post "/api/grit/assays/assay_models/#{model_id}/publish", as: :json
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be true

        post "/api/grit/assays/assay_models/#{model_id}/draft", as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(AssayModel.find(model_id).publication_status.name).to eq("Draft")
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be false
      end

      it "draft action destroys all experiments" do
        post "/api/grit/assays/assay_models", params: {
          name: "Draft Destroys Experiments",
          assay_type_id: biochemical.id
        }, as: :json
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]

        post "/api/grit/assays/assay_models/#{model_id}/publish", as: :json
        expect(response).to have_http_status(:success)

        post "/api/grit/assays/experiments", params: {
          name: "Experiment To Destroy",
          assay_model_id: model_id
        }, as: :json
        expect(response).to have_http_status(:created)
        experiment_id = JSON.parse(response.body)["data"]["id"]

        post "/api/grit/assays/assay_models/#{model_id}/draft", as: :json

        expect(response).to have_http_status(:success)
        expect(Experiment.exists?(experiment_id)).to be false
      end
    end

    # --- update_metadata ---

    describe "update_metadata" do
      before { login_as(admin) }

      it "updates metadata for an assay_model" do
        vocabulary = create(:grit_core_vocabulary)
        species_def = create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
        tissue_def = create(:grit_assays_assay_metadata_definition, :tissue_type, vocabulary: vocabulary)

        post "/api/grit/assays/assay_models", params: {
          name: "Metadata Test Model",
          assay_type_id: biochemical.id
        }, as: :json
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]

        expect {
          post "/api/grit/assays/assay_models/#{model_id}/update_metadata", params: {
            assay_model_id: model_id,
            removed: [],
            added: [ species_def.id ]
          }, as: :json
        }.to change(AssayModelMetadatum, :count).by(1)
        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body)["success"]).to be true
        expect(AssayModelMetadatum.exists?(assay_model_id: model_id, assay_metadata_definition_id: species_def.id)).to be true

        # Swap species for tissue_type
        expect {
          post "/api/grit/assays/assay_models/#{model_id}/update_metadata", params: {
            assay_model_id: model_id,
            removed: [ species_def.id ],
            added: [ tissue_def.id ]
          }, as: :json
        }.to change(AssayModelMetadatum, :count).by(0)

        expect(response).to have_http_status(:success)
        expect(AssayModelMetadatum.exists?(assay_model_id: model_id, assay_metadata_definition_id: tissue_def.id)).to be true
      end
    end

    # --- Export / Import ---

    def upload_for(dump)
      tmp = Tempfile.new([ "assay_dump", ".json" ])
      tmp.write(JSON.generate(dump))
      tmp.rewind
      Rack::Test::UploadedFile.new(tmp.path, "application/json", true)
    end

    def minimal_assay_model_dump(name, data_type: integer_type.name, unit: nil, publication_status: "Draft")
      {
        "name" => name,
        "description" => nil,
        "assay_type" => { "name" => biochemical.name, "description" => biochemical.description },
        "publication_status" => publication_status,
        "assay_model_metadata" => [],
        "assay_data_sheet_definitions" => [ {
          "name" => "Sheet", "description" => nil, "result" => false, "sort" => 0,
          "assay_data_sheet_columns" => [ {
            "name" => "Value", "safe_name" => "value", "description" => nil, "sort" => 0,
            "required" => false, "data_type" => data_type, "data_type_vocabulary" => nil, "unit" => unit
          } ]
        } ]
      }
    end

    def dump_with(assay_models: [], vocabularies: [], experiment_metadata_templates: [])
      { "format" => "grit-assays-export", "version" => 2, "assay_models" => assay_models,
        "vocabularies" => vocabularies, "experiment_metadata_templates" => experiment_metadata_templates }
    end

    def import_dump(dump, selection)
      post "/api/grit/assays/assay_models/import", params: { file: upload_for(dump), selection: JSON.generate(selection) }
    end

    describe "export_options" do
      before { login_as(admin) }

      it "lists assay models with their related templates, vocabularies and templates" do
        vocabulary = create(:grit_core_vocabulary, :with_items)
        metadata_definition = create(:grit_assays_assay_metadata_definition, vocabulary: vocabulary)
        model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
        create(:grit_assays_assay_model_metadatum, assay_model: model, assay_metadata_definition: metadata_definition)
        template = create(:grit_assays_experiment_metadata_template)
        create(:grit_assays_experiment_metadata_template_metadatum, experiment_metadata_template: template,
          assay_metadata_definition: metadata_definition, vocabulary: vocabulary, vocabulary_item: vocabulary.vocabulary_items.first)
        unrelated_template = create(:grit_assays_experiment_metadata_template)

        get "/api/grit/assays/assay_models/export_options", as: :json

        expect(response).to have_http_status(:success)
        data = JSON.parse(response.body)["data"]
        exported_model = data["assay_models"].find { |m| m["id"] == model.id }
        expect(exported_model["experiment_metadata_template_ids"]).to eq([ template.id ])
        expect(data["vocabularies"].map { |v| v["id"] }).to include(vocabulary.id)
        expect(data["experiment_metadata_templates"].map { |t| t["id"] }).to include(template.id, unrelated_template.id)
      end
    end

    describe "export" do
      before { login_as(admin) }

      it "returns only the selected entries, with no ids and with referenced vocabularies embedded" do
        vocabulary = create(:grit_core_vocabulary, :with_items)
        metadata_definition = create(:grit_assays_assay_metadata_definition, vocabulary: vocabulary)
        model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
        create(:grit_assays_assay_model_metadatum, assay_model: model, assay_metadata_definition: metadata_definition)
        sheet = create(:grit_assays_assay_data_sheet_definition, assay_model: model)
        create(:grit_assays_assay_data_sheet_column, assay_data_sheet_definition: sheet, data_type: integer_type)
        create(:grit_assays_assay_model, :draft, assay_type: biochemical)
        other_vocabulary = create(:grit_core_vocabulary, :with_items)
        template = create(:grit_assays_experiment_metadata_template)

        get "/api/grit/assays/assay_models/export",
          params: { assay_model_ids: model.id.to_s, vocabulary_ids: other_vocabulary.id.to_s, experiment_metadata_template_ids: template.id.to_s }

        expect(response).to have_http_status(:success)
        expect(response.content_type).to include("application/json")
        dump = JSON.parse(response.body)
        expect(dump["format"]).to eq("grit-assays-export")
        expect(dump["assay_models"].map { |m| m["name"] }).to eq([ model.name ])
        expect(dump["vocabularies"].map { |v| v["name"] }).to eq([ other_vocabulary.name ])
        expect(dump["experiment_metadata_templates"].map { |t| t["name"] }).to eq([ template.name ])

        exported = dump["assay_models"].first
        expect(exported).not_to have_key("id")
        expect(exported["assay_data_sheet_definitions"].first["assay_data_sheet_columns"].first).not_to have_key("id")
        exported_vocabulary = exported["assay_model_metadata"].first["assay_metadata_definition"]["vocabulary"]
        expect(exported_vocabulary["name"]).to eq(vocabulary.name)
        expect(exported_vocabulary["vocabulary_items"].length).to eq(2)
      end

      it "returns 422 when nothing is selected" do
        get "/api/grit/assays/assay_models/export"
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    describe "import_preview" do
      before { login_as(admin) }

      it "flags installed entries, new dependencies and missing references without writing anything" do
        existing_model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
        existing_vocabulary = create(:grit_core_vocabulary, :with_items)
        dump = dump_with(
          assay_models: [
            minimal_assay_model_dump(existing_model.name),
            minimal_assay_model_dump("New Model"),
            minimal_assay_model_dump("Broken Model", unit: "no_such_unit")
          ],
          vocabularies: [
            { "name" => existing_vocabulary.name, "description" => nil, "vocabulary_items" => [ { "name" => "brand new item" } ] },
            { "name" => "New Vocabulary", "description" => nil, "vocabulary_items" => [ { "name" => "a" } ] }
          ]
        )

        expect {
          post "/api/grit/assays/assay_models/import_preview", params: { file: upload_for(dump) }
        }.not_to change(AssayModel, :count)

        expect(response).to have_http_status(:success)
        data = JSON.parse(response.body)["data"]
        models = data["assay_models"].index_by { |m| m["name"] }
        expect(models[existing_model.name]["installed"]).to be true
        expect(models["New Model"]["installed"]).to be false
        expect(models["New Model"]["problems"]).to be_empty
        expect(models["New Model"]["dependencies"]).to include(include("kind" => "Assay type", "installed" => true))
        expect(models["Broken Model"]["problems"]).to eq([ "Unit 'no_such_unit' not found" ])

        vocabularies = data["vocabularies"].index_by { |v| v["name"] }
        expect(vocabularies[existing_vocabulary.name]["installed"]).to be true
        expect(vocabularies[existing_vocabulary.name]["missing_items"]).to eq([ "brand new item" ])
        expect(vocabularies["New Vocabulary"]["installed"]).to be false
      end

      it "accepts version 1 dumps (a bare array of assay models with embedded templates)" do
        legacy = [ minimal_assay_model_dump("Legacy Model").merge(
          "experiment_metadata_templates" => [ { "name" => "Legacy Template", "description" => nil, "experiment_metadata_template_metadata" => [] } ]
        ) ]

        post "/api/grit/assays/assay_models/import_preview", params: { file: upload_for(legacy) }

        expect(response).to have_http_status(:success)
        data = JSON.parse(response.body)["data"]
        expect(data["assay_models"].map { |m| m["name"] }).to eq([ "Legacy Model" ])
        expect(data["experiment_metadata_templates"].map { |t| t["name"] }).to eq([ "Legacy Template" ])
      end

      it "returns 422 for an invalid JSON file" do
        tmp = Tempfile.new([ "bad", ".json" ])
        tmp.write("not json")
        tmp.rewind

        post "/api/grit/assays/assay_models/import_preview", params: { file: Rack::Test::UploadedFile.new(tmp.path, "application/json", true) }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["success"]).to be false
      end
    end

    describe "import" do
      before { login_as(admin) }

      it "creates only the selected entries, reusing shared references instead of duplicating them" do
        vocabulary = create(:grit_core_vocabulary, :with_items)
        metadata_definition = create(:grit_assays_assay_metadata_definition, vocabulary: vocabulary)
        model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
        create(:grit_assays_assay_model_metadatum, assay_model: model, assay_metadata_definition: metadata_definition)

        not_selected = minimal_assay_model_dump("Not Selected")

        get "/api/grit/assays/assay_models/export", params: { assay_model_ids: model.id.to_s }
        dump = JSON.parse(response.body)
        dump["assay_models"].first["name"] = "Imported Copy"
        dump["assay_models"] << not_selected
        dump["vocabularies"] << { "name" => "Imported Vocabulary", "description" => nil, "vocabulary_items" => [ { "name" => "x" } ] }

        expect {
          import_dump(dump, { "assay_models" => [ "Imported Copy" ], "vocabularies" => [ "Imported Vocabulary" ] })
        }.to change(AssayModel, :count).by(1)
          .and change(AssayType, :count).by(0)
          .and change(Grit::Core::Vocabulary, :count).by(1)
          .and change(AssayMetadataDefinition, :count).by(0)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["data"]["vocabularies"].map { |v| v["name"] }).to eq([ "Imported Vocabulary" ])

        imported = AssayModel.find(json["data"]["assay_models"].first["id"])
        expect(imported.id).not_to eq(model.id)
        expect(imported.name).to eq("Imported Copy")
        expect(imported.assay_type).to eq(biochemical)
        expect(imported.publication_status.name).to eq("Draft")
        expect(imported.assay_model_metadata.first.assay_metadata_definition).to eq(metadata_definition)
        expect(AssayModel.exists?(name: "Not Selected")).to be false
      end

      it "imports a selected experiment metadata template together with the metadata definition it needs" do
        dump = dump_with(experiment_metadata_templates: [ {
          "name" => "Imported Template", "description" => nil,
          "experiment_metadata_template_metadata" => [ {
            "assay_metadata_definition" => {
              "name" => "Imported Definition", "safe_name" => "imported_def", "description" => nil,
              "vocabulary" => { "name" => "Template Vocabulary", "description" => nil, "vocabulary_items" => [ { "name" => "v1" } ] }
            },
            "vocabulary_item" => "v1"
          } ]
        } ])

        expect {
          import_dump(dump, { "experiment_metadata_templates" => [ "Imported Template" ] })
        }.to change(ExperimentMetadataTemplate, :count).by(1)
          .and change(AssayMetadataDefinition, :count).by(1)

        expect(response).to have_http_status(:created)
      end

      it "publishes the imported model and creates its dynamic data sheet tables when the source was published" do
        name = "Published Import #{SecureRandom.hex(4)}"
        import_dump(dump_with(assay_models: [ minimal_assay_model_dump(name, publication_status: "Published") ]), { "assay_models" => [ name ] })

        expect(response).to have_http_status(:created)
        imported = AssayModel.find(JSON.parse(response.body)["data"]["assay_models"].first["id"])
        expect(imported.publication_status.name).to eq("Published")
        sheet = imported.assay_data_sheet_definitions.first
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be true

        post "/api/grit/assays/assay_models/#{imported.id}/draft", as: :json
      end

      it "rejects a selected entry that already exists and commits nothing" do
        existing = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
        dump = dump_with(assay_models: [ minimal_assay_model_dump("Brand New"), minimal_assay_model_dump(existing.name) ])

        expect {
          import_dump(dump, { "assay_models" => [ "Brand New", existing.name ] })
        }.not_to change(AssayModel, :count)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["errors"]).to include("already exists")
      end

      it "rejects an existing vocabulary selected for import" do
        existing = create(:grit_core_vocabulary, :with_items)
        dump = dump_with(vocabularies: [ { "name" => existing.name, "description" => nil, "vocabulary_items" => [] } ])

        import_dump(dump, { "vocabularies" => [ existing.name ] })

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "returns 422 when a selected name is not in the file or nothing is selected" do
        dump = dump_with(assay_models: [ minimal_assay_model_dump("In File") ])

        import_dump(dump, { "assay_models" => [ "Not In File" ] })
        expect(response).to have_http_status(:unprocessable_entity)

        import_dump(dump, {})
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "returns 422 and commits nothing when a referenced data type doesn't exist" do
        dump = dump_with(assay_models: [ minimal_assay_model_dump("Bad Reference Import", data_type: "totally_bogus_type") ])

        expect {
          import_dump(dump, { "assay_models" => [ "Bad Reference Import" ] })
        }.not_to change(AssayModel, :count)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["success"]).to be false
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/assay_models", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
