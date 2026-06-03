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

RSpec.describe "Data Types API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:notadmin) { create(:grit_core_user, :with_read_role) }
  let!(:data_type) { create(:grit_core_data_type, :integer) }

  before(:each) do
    login_as(admin)
  end

  path "/api/grit/core/data_types" do
    get "Lists all data types" do
      tags "Core - Data Types"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "anyone can list data types" do
        before { login_as(notadmin) }
        run_test!
      end
    end
  end

  path "/api/grit/core/data_types/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a data type" do
      tags "Core - Data Types"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "anyone can show data type" do
        let(:id) { data_type.id }
        before { login_as(notadmin) }
        run_test!
      end
    end
  end

  describe "SQL injection prevention in guess_data_type_for_columns" do
    context "when an entity data type name contains SQL injection characters" do
      let!(:malicious_data_type) do
        # Entity data type (is_entity: true) pointing to the Countries table.
        # The controller processes these and interpolates data_type.name into SQL.
        # connection.quote() in the fix escapes the single quote, preventing injection.
        create(:grit_core_data_type, :entity,
               name: "sqli'; SELECT 'sqli_probe'; --",
               table_name: "grit_core_countries")
      end

      it "quotes data type names, preventing second-order SQL injection" do
        get "/api/grit/core/data_types/guess_data_type_for_columns",
            params: { columns: { col1: [ "test_value" ] } }
        expect(response).not_to have_http_status(:internal_server_error)
        # The probe was never executed — it must not appear as a SQL result value
        expect(response.body).not_to include("sqli_probe")
      end
    end
  end
end
