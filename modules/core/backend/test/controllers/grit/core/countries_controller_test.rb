require "test_helper"

module Grit::Core
  class CountriesControllerTest < ActionDispatch::IntegrationTest
    include GritEntityControllerTestHelper

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @country = grit_core_countries(:one)
    end

    test "read-only entity behavior" do
      assert_read_only_entity(
        model_class: Country,
        index_url: countries_url,
        show_url: country_url(@country),
        create_params: { name: "Yop", iso: "YP" },
        update_url: country_url(@country),
        update_params: { name: "Testtest" },
        destroy_url: country_url(@country)
      )
    end
  end
end
