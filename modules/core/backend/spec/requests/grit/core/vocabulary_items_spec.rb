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

RSpec.describe "Vocabulary Items API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:vocabulary) { create(:grit_core_vocabulary, name: "test_vocab") }
  let!(:vocabulary_item) { create(:grit_core_vocabulary_item, name: "item_one", vocabulary: vocabulary) }

  before(:each) do
    login_as(admin)
  end

  path "/api/grit/core/vocabulary_items" do
    get "Lists all vocabulary items" do
      tags "Core - Vocabulary Items"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "vocabulary items listed" do
        run_test!
      end
    end

    post "Creates a vocabulary item" do
      tags "Core - Vocabulary Items"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :item_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          vocabulary_id: { type: :integer }
        }
      }

      response "201", "vocabulary item created" do
        let(:item_params) { { name: "onethree", vocabulary_id: vocabulary.id } }

        it "increases vocabulary item count" do
          expect {
            post "/api/grit/core/vocabulary_items", params: { name: "another", vocabulary_id: vocabulary.id }, as: :json
          }.to change(Grit::Core::VocabularyItem, :count).by(1)
        end

        run_test!
      end
    end
  end

  path "/api/grit/core/vocabulary_items/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a vocabulary item" do
      tags "Core - Vocabulary Items"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "vocabulary item found" do
        let(:id) { vocabulary_item.id }
        run_test!
      end
    end

    patch "Updates a vocabulary item" do
      tags "Core - Vocabulary Items"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :item_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "200", "vocabulary item updated" do
        let(:id) { vocabulary_item.id }
        let(:item_params) { { name: "wantwo" } }
        run_test!
      end
    end

    delete "Destroys a vocabulary item" do
      tags "Core - Vocabulary Items"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "vocabulary item destroyed" do
        let(:id) { vocabulary_item.id }

        run_test! do
          expect(Grit::Core::VocabularyItem.find_by(id: vocabulary_item.id)).to be_nil
        end
      end
    end
  end
end
