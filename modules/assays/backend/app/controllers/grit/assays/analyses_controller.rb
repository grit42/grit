module Grit::Assays
  class AnalysesController < ApplicationController
    include Grit::Core::GritEntityController

    private

    def permitted_params
      [ :name, :description, :assay_data_sheet_definition_id, filters: {}, plots: {} ]
    end
  end
end
