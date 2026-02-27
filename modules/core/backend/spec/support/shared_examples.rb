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


# Shared examples for read-only entities (Country, Role, DataType, etc.)
# These entities allow index/show but forbid create/update/destroy.
RSpec.shared_examples "a read-only entity" do |opts|
  let(:model_class) { opts[:model_class] }
  let(:index_url) { opts[:index_url] }
  let(:show_url) { opts[:show_url] }
  let(:create_params) { opts[:create_params] }
  let(:update_url) { opts[:update_url] }
  let(:update_params) { opts[:update_params] }
  let(:destroy_url) { opts[:destroy_url] }

  it "allows index" do
    get index_url, as: :json
    expect(response).to have_http_status(:success)
  end

  it "allows show" do
    get show_url, as: :json
    expect(response).to have_http_status(:success)
  end

  it "forbids create" do
    expect {
      post index_url, params: create_params, as: :json
    }.not_to change(model_class, :count)
    expect(response).to have_http_status(:forbidden)
  end

  it "forbids update" do
    patch update_url, params: update_params, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "forbids destroy" do
    expect {
      delete destroy_url, as: :json
    }.not_to change(model_class, :count)
    expect(response).to have_http_status(:forbidden)
  end
end

# Shared examples for admin-only CRUD entities (Location, Origin, Unit, etc.)
# Anyone can read, only admin can write.
RSpec.shared_examples "an admin-only CRUD entity" do |opts|
  let(:model_class) { opts[:model_class] }
  let(:admin_user) { opts[:admin_user] }
  let(:non_admin_user) { opts[:non_admin_user] }
  let(:index_url) { opts[:index_url] }
  let(:show_url) { opts[:show_url] }
  let(:create_params) { opts[:create_params] }
  let(:update_url) { opts[:update_url] }
  let(:update_params) { opts[:update_params] }
  let(:destroy_url) { opts[:destroy_url] }

  context "as non-admin" do
    before { login_as(non_admin_user) }

    it "allows index" do
      get index_url, as: :json
      expect(response).to have_http_status(:success)
    end

    it "allows show" do
      get show_url, as: :json
      expect(response).to have_http_status(:success)
    end

    it "forbids create" do
      expect {
        post index_url, params: create_params, as: :json
      }.not_to change(model_class, :count)
      expect(response).to have_http_status(:forbidden)
    end

    it "forbids update" do
      patch update_url, params: update_params, as: :json
      expect(response).to have_http_status(:forbidden)
    end

    it "forbids destroy" do
      expect {
        delete destroy_url, as: :json
      }.not_to change(model_class, :count)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "as admin" do
    before { login_as(admin_user) }

    it "allows create" do
      expect {
        post index_url, params: create_params, as: :json
      }.to change(model_class, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it "allows update" do
      patch update_url, params: update_params, as: :json
      expect(response).to have_http_status(:success)
    end

    it "allows destroy" do
      expect {
        delete destroy_url, as: :json
      }.to change(model_class, :count).by(-1)
      expect(response).to have_http_status(:success)
    end
  end
end
