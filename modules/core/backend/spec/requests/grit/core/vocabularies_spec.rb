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

RSpec.describe "Vocabularies API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let!(:vocabulary) { create(:grit_core_vocabulary, name: "test_vocab") }

  before(:each) do
    login_as(admin)
  end

  path "/api/grit/core/vocabularies" do
    get "Lists all vocabularies" do
      tags "Core - Vocabularies"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "vocabularies listed" do
        run_test!
      end
    end

    post "Creates a vocabulary" do
      tags "Core - Vocabularies"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :vocab_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "201", "vocabulary created" do
        let(:vocab_params) { { name: "two" } }

        it "increases vocabulary count" do
          expect {
            post "/api/grit/core/vocabularies", params: { name: "another" }, as: :json
          }.to change(Grit::Core::Vocabulary, :count).by(1)
        end

        run_test!
      end
    end
  end

  path "/api/grit/core/vocabularies/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a vocabulary" do
      tags "Core - Vocabularies"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "vocabulary found" do
        let(:id) { vocabulary.id }
        run_test!
      end
    end

    patch "Updates a vocabulary" do
      tags "Core - Vocabularies"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :vocab_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "200", "vocabulary updated" do
        let(:id) { vocabulary.id }
        let(:vocab_params) { { name: "wan" } }
        run_test!
      end
    end

    delete "Destroys a vocabulary" do
      tags "Core - Vocabularies"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "vocabulary destroyed" do
        let(:id) { vocabulary.id }

        it "decreases vocabulary count" do
          expect {
            delete "/api/grit/core/vocabularies/#{vocabulary.id}", as: :json
          }.to change(Grit::Core::Vocabulary, :count).by(-1)
        end

        run_test!
      end
    end
  end
end
