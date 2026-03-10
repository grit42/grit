# frozen_string_literal: true

# Shared test helpers for GritEntityController integration tests.
# Provides assertion helpers for common CRUD permission patterns.
module GritEntityControllerTestHelper
  extend ActiveSupport::Concern

  included do
    include Grit::Core::Engine.routes.url_helpers
    include Authlogic::TestCase
  end

  # Asserts read-only entity behavior: index/show succeed, create/update/destroy forbidden.
  # Used by read-only entities like Country, Role, DataType, LoadSetStatus, PublicationStatus.
  #
  # @param model_class [Class] The ActiveRecord model class
  # @param index_url [String] URL for index action
  # @param show_url [String] URL for show action
  # @param create_params [Hash] Params to attempt create with
  # @param update_url [String] URL for update action
  # @param update_params [Hash] Params to attempt update with
  # @param destroy_url [String] URL for destroy action
  def assert_read_only_entity(model_class:, index_url:, show_url:, create_params:, update_url:, update_params:, destroy_url:)
    get index_url, as: :json
    assert_response :success, "Expected index to succeed"

    get show_url, as: :json
    assert_response :success, "Expected show to succeed"

    assert_no_difference(-> { model_class.count }, "Expected create to not change count") do
      post index_url, params: create_params, as: :json
    end
    assert_response :forbidden, "Expected create to be forbidden"

    patch update_url, params: update_params, as: :json
    assert_response :forbidden, "Expected update to be forbidden"

    assert_no_difference(-> { model_class.count }, "Expected destroy to not change count") do
      delete destroy_url, as: :json
    end
    assert_response :forbidden, "Expected destroy to be forbidden"
  end

  # Asserts admin-only CRUD: anyone can read, only admin can write.
  # Used by entities like Location, Origin, Unit.
  #
  # @param model_class [Class] The ActiveRecord model class
  # @param admin_user [User] User with admin privileges
  # @param non_admin_user [User] User without admin privileges
  # @param index_url [String] URL for index action
  # @param show_url [String] URL for show action
  # @param create_params [Hash] Params for creating a new record
  # @param update_url [String] URL for update action
  # @param update_params [Hash] Params for updating record
  # @param destroy_url [String] URL for destroy action
  def assert_admin_only_crud(
    model_class:,
    admin_user:,
    non_admin_user:,
    index_url:,
    show_url:,
    create_params:,
    update_url:,
    update_params:,
    destroy_url:
  )
    # Non-admin can read
    login(non_admin_user)
    get index_url, as: :json
    assert_response :success, "Expected non-admin to access index"

    get show_url, as: :json
    assert_response :success, "Expected non-admin to access show"

    # Non-admin cannot write
    assert_no_difference(-> { model_class.count }, "Expected non-admin create to fail") do
      post index_url, params: create_params, as: :json
    end
    assert_response :forbidden, "Expected non-admin create to be forbidden"

    patch update_url, params: update_params, as: :json
    assert_response :forbidden, "Expected non-admin update to be forbidden"

    assert_no_difference(-> { model_class.count }, "Expected non-admin destroy to fail") do
      delete destroy_url, as: :json
    end
    assert_response :forbidden, "Expected non-admin destroy to be forbidden"

    # Admin can write
    login(admin_user)
    assert_difference(-> { model_class.count }, 1, "Expected admin create to succeed") do
      post index_url, params: create_params, as: :json
    end
    assert_response :created, "Expected admin create response to be :created"

    patch update_url, params: update_params, as: :json
    assert_response :success, "Expected admin update to succeed"

    assert_difference(-> { model_class.count }, -1, "Expected admin destroy to succeed") do
      delete destroy_url, as: :json
    end
    assert_response :success, "Expected admin destroy to succeed"
  end
end
