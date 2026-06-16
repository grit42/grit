module Grit::Assays
  class AnalysisExperiment < ApplicationRecord
    include Grit::Core::GritEntityRecord

    display_column "name"

    entity_crud_with read: [ "read:system" ], write: [ "write:analysis" ]

    belongs_to :analysis
    belongs_to :experiment

    def self.selected_experiments(params)
      analysis = Grit::Assays::Analysis.find(params[:analysis_id])
      Grit::Assays::Experiment.detailed.select("ae.id as experiment_analysis_id").joins("JOIN #{self.table_name} ae on ae.experiment_id = #{Grit::Assays::Experiment.table_name}.id").where("ae.analysis_id = ?", params[:analysis_id].to_i)
    end

    def self.available_experiments(params)
      analysis = Grit::Assays::Analysis.find(params[:analysis_id])
      exp_table = self.connection.quote_table_name(Grit::Assays::Experiment.table_name)
      adsd_table = self.connection.quote_table_name(Grit::Assays::AssayDataSheetDefinition.table_name)
      query = Grit::Assays::Experiment.published.joins(sanitize_sql_array([ "LEFT OUTER JOIN #{self.table_name} ae on ae.experiment_id = #{Grit::Assays::Experiment.table_name}.id AND ae.analysis_id = ?", params[:analysis_id].to_i ])).where("ae.id IS NULL")
      query = query.joins(sanitize_sql_array([ "JOIN #{adsd_table} on #{adsd_table}.assay_model_id = #{exp_table}.assay_model_id AND #{adsd_table}.id = ?", analysis.assay_data_sheet_definition_id ]))
      query
    end
  end
end
