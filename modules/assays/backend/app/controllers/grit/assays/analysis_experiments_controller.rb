module Grit::Assays
  class AnalysisExperimentsController < ApplicationController
    include Grit::Core::GritEntityController

    private

    def permitted_params
      [ :analysis_id, :experiment_id ]
    end
  end
end
