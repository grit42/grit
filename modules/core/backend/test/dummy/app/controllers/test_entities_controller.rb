class TestEntitiesController < ApplicationController
  include Grit::Core::GritEntityController

  private

  def permitted_params
    [ "name", "another_string", "integer", "decimal", "float", "text", "datetime", "date", "boolean", "user_id" ]
  end
end
