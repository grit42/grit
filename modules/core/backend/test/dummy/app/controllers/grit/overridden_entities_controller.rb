class Grit::OverriddenEntitiesController < ApplicationController
  include Grit::Core::GritEntityController

  def model_override(params)
    return Grit::Core::Role if params[:as_role] == "1"
    Grit::TestEntity
  end

  private

  def permitted_params
    [ "name", "another_string", "integer", "decimal", "float", "text", "datetime", "date", "boolean", "user_id" ]
  end
end
