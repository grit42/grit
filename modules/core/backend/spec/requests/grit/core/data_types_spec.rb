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

RSpec.describe "Data Types API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:notadmin) { create(:grit_core_user) }
  let!(:data_type) { create(:grit_core_data_type, :integer) }

  before(:each) do
    login_as(admin)
  end

  path "/api/grit/core/data_types" do
    get "Lists all data types" do
      tags "Core - Data Types"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "anyone can list data types" do
        before { login_as(notadmin) }
        run_test!
      end
    end

    post "Attempts to create a data type" do
      tags "Core - Data Types"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :data_type_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "403", "creation is forbidden" do
        let(:data_type_params) { { name: "test" } }

        it "does not change the count" do
          expect {
            post "/api/grit/core/data_types", params: { name: "test" }, as: :json
          }.not_to change(Grit::Core::DataType, :count)
        end

        run_test!
      end
    end
  end

  path "/api/grit/core/data_types/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a data type" do
      tags "Core - Data Types"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "anyone can show data type" do
        let(:id) { data_type.id }
        before { login_as(notadmin) }
        run_test!
      end
    end

    patch "Attempts to update a data type" do
      tags "Core - Data Types"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :data_type_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "403", "update is forbidden" do
        let(:id) { data_type.id }
        let(:data_type_params) { { name: "test" } }
        run_test!
      end
    end

    delete "Attempts to destroy a data type" do
      tags "Core - Data Types"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "403", "destruction is forbidden" do
        let(:id) { data_type.id }

        it "does not change the count" do
          expect {
            delete "/api/grit/core/data_types/#{data_type.id}", as: :json
          }.not_to change(Grit::Core::DataType, :count)
        end

        run_test!
      end
    end
  end
end
