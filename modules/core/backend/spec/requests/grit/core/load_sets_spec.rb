# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.


require "openapi_helper"

RSpec.describe "Load Sets API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:origin) { create(:grit_core_origin) }
  let(:load_set) { create(:grit_core_load_set, :with_mapping_block, origin_id: origin.id) }

  # The EntityLoader and LoadSet model require LoadSetStatus records to
  # exist. Minitest had these via fixtures; factory_bot needs them seeded.
  before(:each) do
    %w[Created Initializing Mapping Mapped Validating Validated
       Invalidated Succeeded Errored].each do |status_name|
      Grit::Core::LoadSetStatus.find_or_create_by!(name: status_name) do |s|
        s.description = status_name
      end
    end
    login_as(admin)
  end

  path "/api/grit/core/load_sets" do
    get "Lists all load sets" do
      tags "Core - Load Sets"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "load sets listed" do
        run_test!
      end
    end

    post "Creates a load set with load set blocks" do
      tags "Core - Load Sets"
      consumes "multipart/form-data"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      # rswag submit_request does not handle multipart file uploads well,
      # so we test load set creation with explicit POST calls below.
      response "201", "load set created" do
        it "creates a load set and block", rswag: false do
          load_set_params = {
            name: "test-entity-new",
            entity: "TestEntity",
            origin_id: origin.id,
            load_set_blocks: {
              "0" => {
                name: "test-block",
                separator: ",",
                data: Rack::Test::UploadedFile.new(
                  File.join(FILE_FIXTURE_PATH, "test_entity.csv"), "text/csv"
                )
              }
            }
          }

          expect {
            post "/api/grit/core/load_sets", params: load_set_params
          }.to change(Grit::Core::LoadSet, :count).by(1)
            .and change(Grit::Core::LoadSetBlock, :count).by(1)

          expect(response).to have_http_status(:created)
        end
      end
    end
  end

  path "/api/grit/core/load_sets/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a load set" do
      tags "Core - Load Sets"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "load set found" do
        let(:id) { load_set.id }

        run_test! do
          data = JSON.parse(response.body)["data"]
          expect(data["name"]).to eq(load_set.name)
          expect(data.keys).to include("load_set_blocks")
        end
      end
    end

    delete "Destroys a load set" do
      tags "Core - Load Sets"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "load set destroyed (no succeeded blocks)" do
        let(:id) do
          # Create a load set via the API so we can delete it.
          # Need to ensure origin and "Created" status exist first.
          origin
          Grit::Core::LoadSetStatus.find_or_create_by!(name: "Created") { |s| s.description = "Created" }
          post "/api/grit/core/load_sets", params: {
            name: "test-entity-to-delete",
            entity: "TestEntity",
            origin_id: origin.id,
            load_set_blocks: {
              "0" => {
                name: "test-block",
                separator: ",",
                data: Rack::Test::UploadedFile.new(
                  File.join(FILE_FIXTURE_PATH, "test_entity.csv"), "text/csv"
                )
              }
            }
          }
          Grit::Core::LoadSet.find_by!(name: "test-entity-to-delete").id
        end

        run_test!
      end
    end
  end

  describe "succeeded load set" do
    let!(:succeeded_load_set) { create(:grit_core_load_set, :with_succeeded_block, origin_id: origin.id) }

    it "should not destroy succeeded load set" do
      expect {
        delete "/api/grit/core/load_sets/#{succeeded_load_set.id}", as: :json
      }.not_to change(Grit::Core::LoadSet, :count)

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)["errors"]).to include("it must be undone first")
    end

    it "should rollback load set and then destroy" do
      # Create actual loaded records for the rollback to work
      succeeded_load_set.load_set_blocks.each do |lsb|
        2.times do
          entity = TestEntity.create!(name: "rollback-test-#{SecureRandom.hex(4)}")
          Grit::Core::LoadSetBlockLoadedRecord.create!(
            load_set_block_id: lsb.id,
            record_id: entity.id,
            table: "test_entities"
          )
        end
      end

      expect {
        post "/api/grit/core/load_sets/#{succeeded_load_set.id}/rollback", as: :json
      }.to change(TestEntity, :count).by(-2)

      expect(response).to have_http_status(:success)

      expect {
        delete "/api/grit/core/load_sets/#{succeeded_load_set.id}", as: :json
      }.to change(Grit::Core::LoadSet, :count).by(-1)

      expect(response).to have_http_status(:success)
    end
  end
end
