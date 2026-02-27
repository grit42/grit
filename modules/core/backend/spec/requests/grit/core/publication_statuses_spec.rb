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

RSpec.describe "Publication Statuses API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let!(:publication_status) { create(:grit_core_publication_status, :draft) }

  before(:each) do
    login_as(admin)
  end

  path "/api/grit/core/publication_statuses" do
    get "Lists all publication statuses" do
      tags "Core - Publication Statuses"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "publication statuses listed" do
        run_test!
      end
    end

    post "Attempts to create a publication status" do
      tags "Core - Publication Statuses"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :status_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "403", "creation is forbidden" do
        let(:status_params) { { name: "nope" } }

        it "does not change the count" do
          expect {
            post "/api/grit/core/publication_statuses", params: { name: "nope" }, as: :json
          }.not_to change(Grit::Core::PublicationStatus, :count)
        end

        run_test!
      end
    end
  end

  path "/api/grit/core/publication_statuses/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a publication status" do
      tags "Core - Publication Statuses"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "publication status found" do
        let(:id) { publication_status.id }
        run_test!
      end
    end

    patch "Attempts to update a publication status" do
      tags "Core - Publication Statuses"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :status_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "403", "update is forbidden" do
        let(:id) { publication_status.id }
        let(:status_params) { { name: "nope" } }
        run_test!
      end
    end

    delete "Attempts to destroy a publication status" do
      tags "Core - Publication Statuses"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "403", "destruction is forbidden" do
        let(:id) { publication_status.id }

        it "does not change the count" do
          expect {
            delete "/api/grit/core/publication_statuses/#{publication_status.id}", as: :json
          }.not_to change(Grit::Core::PublicationStatus, :count)
        end

        run_test!
      end
    end
  end
end
