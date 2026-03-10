# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class ExperimentMetadataTemplateMetadataControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    # NOTE: There is no separate controller for experiment_metadata_template_metadata.
    # The metadata is managed through the ExperimentMetadataTemplatesController
    # using the set_metadata_values method during create and update actions.
    #
    # See experiment_metadata_templates_controller_test.rb for full CRUD testing
    # of templates including their metadata.

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
    end

    test "metadata is managed through template controller" do
      # Metadata is created/updated through the templates controller
      # This is a placeholder test to document the architecture
      assert defined?(ExperimentMetadataTemplatesController)
      assert defined?(ExperimentMetadataTemplateMetadatum)
    end
  end
end
