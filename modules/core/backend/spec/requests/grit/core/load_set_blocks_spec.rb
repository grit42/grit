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


require "swagger_helper"

RSpec.describe "Load Set Blocks API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:origin) { create(:grit_core_origin) }
  let(:load_set) { create(:grit_core_load_set, origin_id: origin.id) }

  # Statuses must exist before any block factory runs because the block
  # factory's default association is `:mapping`, which looks up the
  # "Mapping" status via find_or_create_by!. Confirming is required by
  # the `confirm` action (load_set_blocks_controller.rb:149).
  before(:each) do
    %w[Created Initializing Mapping Mapped Validating Validated
       Invalidated Confirming Succeeded Errored].each do |status_name|
      Grit::Core::LoadSetStatus.find_or_create_by!(name: status_name) do |s|
        s.description = status_name
      end
    end
    login_as(admin)
  end

  # ------------------------------------------------------------------
  # Collection: field metadata
  # ------------------------------------------------------------------

  path "/api/grit/core/load_set_blocks/fields" do
    get "Lists load set block fields" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "fields listed" do
        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"]).to be_an(Array)
        end
      end
    end
  end

  # ------------------------------------------------------------------
  # Member: metadata endpoints (no dynamic tables required)
  # ------------------------------------------------------------------

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/mapping_fields" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    get "Lists mapping fields for a load set block" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "mapping fields listed" do
        let(:block) { create(:grit_core_load_set_block, load_set: load_set) }
        let(:load_set_block_id) { block.id }

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"]).to be_an(Array)
        end
      end

      response "500", "load set block not found" do
        let(:load_set_block_id) { 0 }

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be false
          expect(body["errors"]).to be_present
        end
      end
    end
  end

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/loaded_data_columns" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    get "Lists loaded data columns for a load set block" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "loaded data columns listed" do
        let(:block) { create(:grit_core_load_set_block, load_set: load_set) }
        let(:load_set_block_id) { block.id }

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"]).to be_an(Array)
        end
      end
    end
  end

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/entity_info" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    get "Shows the entity info for a load set block" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "entity info returned" do
        let(:block) { create(:grit_core_load_set_block, load_set: load_set) }
        let(:load_set_block_id) { block.id }

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"]).to include("full_name", "name", "plural", "path")
        end
      end
    end
  end

  # ------------------------------------------------------------------
  # Data scopes (dynamic per-block tables — stubbed)
  #
  # preview_data/errored_data/warning_data delegate to the base
  # GritEntityController#index with params[:scope] set. That calls
  # klass.send(scope, params), which on LoadSetBlock reads from
  # raw_lsb_<id>/lsb_<id> tables that only exist after
  # InitializeLoadSetBlockJob has run. Stub the class-level scope methods
  # so we can assert the controller wiring without provisioning tables.
  # ------------------------------------------------------------------

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/preview_data" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    get "Paginated preview data for a load set block" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "preview data returned" do
        let(:block) { create(:grit_core_load_set_block, load_set: load_set) }
        let(:load_set_block_id) { block.id }

        before do
          allow(Grit::Core::LoadSetBlock).to receive(:preview_data).and_return(Grit::Core::LoadSetBlock.none)
        end

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body).to include("data", "cursor", "total")
        end
      end
    end
  end

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/errored_data" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    get "Paginated errored data for a load set block" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "errored data returned" do
        let(:block) { create(:grit_core_load_set_block, load_set: load_set) }
        let(:load_set_block_id) { block.id }

        before do
          allow(Grit::Core::LoadSetBlock).to receive(:errored_data).and_return(Grit::Core::LoadSetBlock.none)
        end

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body).to include("data", "cursor", "total")
        end
      end
    end
  end

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/warning_data" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    get "Paginated warning data for a load set block" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "warning data returned" do
        let(:block) { create(:grit_core_load_set_block, load_set: load_set) }
        let(:load_set_block_id) { block.id }

        before do
          allow(Grit::Core::LoadSetBlock).to receive(:warning_data).and_return(Grit::Core::LoadSetBlock.none)
        end

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body).to include("data", "cursor", "total")
        end
      end
    end
  end

  # ------------------------------------------------------------------
  # CSV exports — stub the Exporter so we don't hit dynamic tables.
  # ------------------------------------------------------------------

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/export_errored_rows" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    get "Exports errored rows as CSV" do
      tags "Core - Load Set Blocks"
      produces "application/csv"
      security [ { bearer_auth: [] } ]

      response "200", "errored rows exported" do
        let(:block) { create(:grit_core_load_set_block, load_set: load_set) }
        let(:load_set_block_id) { block.id }

        before do
          allow_any_instance_of(Grit::Core::LoadSetBlock).to receive(:errored_rows).and_return(Grit::Core::LoadSetBlock.none)
          allow(Grit::Core::Exporter).to receive(:scope_to_csv) do |_scope, _columns, &blk|
            file = Tempfile.new("errored_rows")
            file.write("line\n")
            file.rewind
            blk.call(file)
          end
        end

        it "streams a CSV attachment", rswag: false do
          get "/api/grit/core/load_set_blocks/#{block.id}/export_errored_rows"

          expect(response).to have_http_status(:success)
          expect(response.headers["Content-Type"]).to include("application/csv")
          expect(response.headers["Content-Disposition"]).to include("#{block.name}_errored_rows.csv")
        end
      end

      response "500", "load set block id missing returns error" do
        let(:load_set_block_id) { 0 }

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be false
          expect(body["errors"]).to be_present
        end
      end
    end
  end

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/export_errors" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    get "Exports flattened errors as CSV" do
      tags "Core - Load Set Blocks"
      produces "application/csv"
      security [ { bearer_auth: [] } ]

      response "200", "errors exported" do
        let(:block) { create(:grit_core_load_set_block, load_set: load_set) }
        let(:load_set_block_id) { block.id }

        before do
          allow_any_instance_of(Grit::Core::LoadSetBlock).to receive(:flattened_errors).and_return(Grit::Core::LoadSetBlock.none)
          allow(Grit::Core::Exporter).to receive(:scope_to_csv) do |_scope, _columns, &blk|
            file = Tempfile.new("errors")
            file.write("line,column_name,value,error\n")
            file.rewind
            blk.call(file)
          end
        end

        it "streams a CSV attachment", rswag: false do
          get "/api/grit/core/load_set_blocks/#{block.id}/export_errors"

          expect(response).to have_http_status(:success)
          expect(response.headers["Content-Type"]).to include("application/csv")
          expect(response.headers["Content-Disposition"]).to include("#{block.name}_errors.csv")
        end
      end
    end
  end

  # ------------------------------------------------------------------
  # Validation progress — stubs the dynamic AR classes.
  # ------------------------------------------------------------------

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/validation_progress" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    get "Reports validation progress for a load set block" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "progress returned" do
        let(:block) { create(:grit_core_load_set_block, load_set: load_set) }
        let(:load_set_block_id) { block.id }

        before do
          raw_klass = Class.new do
            def self.count(_scope = nil)
              10
            end
          end
          loading_klass = Class.new do
            def self.count(_scope = nil)
              3
            end
          end
          allow_any_instance_of(Grit::Core::LoadSetBlock).to receive(:raw_data_klass).and_return(raw_klass)
          allow_any_instance_of(Grit::Core::LoadSetBlock).to receive(:loading_record_klass).and_return(loading_klass)
        end

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"]).to eq("total" => 10, "validated" => 3)
        end
      end
    end
  end

  # ------------------------------------------------------------------
  # State transitions: validate / confirm / undo_validation / rollback
  # ------------------------------------------------------------------

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/validate" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    post "Validates a load set block" do
      tags "Core - Load Set Blocks"
      consumes "application/json"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      parameter name: :validate_params, in: :body, required: false, schema: {
        type: :object,
        properties: {
          mappings: {
            type: :object,
            description: "Property → header/constant mapping. Overrides any existing block mappings.",
            additionalProperties: {
              type: :object,
              properties: {
                header: { type: :string },
                constant: { type: :string }
              }
            }
          }
        }
      }

      response "202", "validation enqueued" do
        let(:block) do
          create(:grit_core_load_set_block, :mapping,
            load_set: load_set,
            mappings: { "name" => { "header" => "col_0" } }
          )
        end
        let(:load_set_block_id) { block.id }
        let(:validate_params) { {} }

        around(:each) do |example|
          original_adapter = ActiveJob::Base.queue_adapter
          ActiveJob::Base.queue_adapter = :test
          example.run
          ActiveJob::Base.queue_adapter = original_adapter
        end

        it "enqueues a validation job and moves the block to Validating", rswag: false do
          expect {
            post "/api/grit/core/load_set_blocks/#{block.id}/validate", as: :json
          }.to have_enqueued_job(Grit::Core::ValidateLoadSetBlockJob).with(block.id, admin.id)

          expect(response).to have_http_status(:accepted)
          expect(JSON.parse(response.body)["success"]).to be true
          expect(block.reload.status.name).to eq("Validating")
        end
      end

      response "403", "status does not allow validation" do
        let(:block) { create(:grit_core_load_set_block, :succeeded, load_set: load_set) }
        let(:load_set_block_id) { block.id }
        let(:validate_params) { {} }

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be false
          expect(body["errors"]).to include("Mapping")
        end
      end

      response "422", "no mappings provided" do
        let(:block) do
          create(:grit_core_load_set_block, :mapping, load_set: load_set, mappings: nil)
        end
        let(:load_set_block_id) { block.id }
        let(:validate_params) { {} }

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be false
          expect(body["errors"]).to eq("No mappings provided")
        end
      end

      response "404", "load set block not found" do
        let(:load_set_block_id) { 0 }
        let(:validate_params) { {} }

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be false
          expect(body["errors"]).to eq("Load set block not found")
        end
      end
    end
  end

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/confirm" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    post "Confirms a validated load set block" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "202", "confirmation enqueued" do
        let(:validated_status) { Grit::Core::LoadSetStatus.find_by!(name: "Validated") }
        let(:block) do
          create(:grit_core_load_set_block, load_set: load_set, status: validated_status)
        end
        let(:load_set_block_id) { block.id }

        around(:each) do |example|
          original_adapter = ActiveJob::Base.queue_adapter
          ActiveJob::Base.queue_adapter = :test
          example.run
          ActiveJob::Base.queue_adapter = original_adapter
        end

        it "enqueues a confirmation job and moves the block to Confirming", rswag: false do
          expect {
            post "/api/grit/core/load_set_blocks/#{block.id}/confirm", as: :json
          }.to have_enqueued_job(Grit::Core::ConfirmLoadSetBlockJob).with(block.id, admin.id)

          expect(response).to have_http_status(:accepted)
          expect(JSON.parse(response.body)["success"]).to be true
          expect(block.reload.status.name).to eq("Confirming")
        end
      end

      response "403", "status does not allow confirmation" do
        let(:block) { create(:grit_core_load_set_block, :mapping, load_set: load_set) }
        let(:load_set_block_id) { block.id }

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be false
          expect(body["errors"]).to include("Validated")
        end
      end

      response "404", "load set block not found" do
        let(:load_set_block_id) { 0 }

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be false
          expect(body["errors"]).to eq("Load set block not found")
        end
      end
    end
  end

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/undo_validation" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    post "Undoes validation and returns the block to Mapping" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "validation undone" do
        let(:validated_status) { Grit::Core::LoadSetStatus.find_by!(name: "Validated") }
        let(:block) do
          create(:grit_core_load_set_block, load_set: load_set, status: validated_status)
        end
        let(:load_set_block_id) { block.id }

        before do
          # truncate_loading_records_table hits the dynamic lsb_<id> table
          # that InitializeLoadSetBlockJob would have created in real usage.
          allow_any_instance_of(Grit::Core::LoadSetBlock).to receive(:truncate_loading_records_table)
        end

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(block.reload.status.name).to eq("Mapping")
          expect(block.has_errors).to be false
          expect(block.has_warnings).to be false
        end
      end
    end
  end

  path "/api/grit/core/load_set_blocks/{load_set_block_id}/rollback" do
    parameter name: :load_set_block_id, in: :path, type: :integer

    post "Rolls back a load set block to Created" do
      tags "Core - Load Set Blocks"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "block rolled back" do
        let(:succeeded_status) { Grit::Core::LoadSetStatus.find_by!(name: "Succeeded") }
        let(:block) do
          create(:grit_core_load_set_block, load_set: load_set, status: succeeded_status)
        end
        let(:load_set_block_id) { block.id }

        before do
          allow(Grit::Core::EntityLoader).to receive(:rollback_load_set_block)
          # initialize_data enqueues InitializeLoadSetBlockJob which hits
          # Grit::Core::User.current; stub to keep the spec hermetic.
          allow_any_instance_of(Grit::Core::LoadSetBlock).to receive(:initialize_data)
        end

        run_test! do
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(block.reload.status.name).to eq("Created")
          expect(Grit::Core::EntityLoader).to have_received(:rollback_load_set_block)
        end
      end
    end
  end
end
