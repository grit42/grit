module Grit::Assays
    class AnalysisRecordsController < ApplicationController
        include Grit::Core::GritEntityController

        def model_override(params)
            analysis = Analysis.find(params[:analysis_id]) if params[:analysis_id].present?
            assay_data_sheet_definition = analysis.assay_data_sheet_definition
            klass = assay_data_sheet_definition.sheet_record_klass

            klass.class_eval do
                @analysis = analysis
                @assay_data_sheet_definition = assay_data_sheet_definition

                def self.entity_scope?(scope)
                    [ "for_analysis", "detailed" ].include?(scope)
                end

                def self.entity_crud
                    {
                        read: [ "read:system" ]
                    }
                end

                def self.for_analysis(params)
                    analaysis_experiments_table = self.connection.quote_table_name(Grit::Assays::AnalysisExperiment.table_name)
                    records_table = self.connection.quote_table_name(self.table_name)
                    query = self.published(params)
                    if Grit::Assays::AnalysisExperiment.where(analysis_id: @analysis.id).count.positive?
                        query = query.joins(
                            "JOIN #{analaysis_experiments_table} on #{analaysis_experiments_table}.experiment_id = #{records_table}.experiment_id"
                        )
                    end
                    sql = Grit::Assays::JsonTreeFilter.to_sql(
                        tree: @analysis.filters,
                        properties: self.entity_properties,
                        table_qualifier: @assay_data_sheet_definition.table_name
                    )
                    sql ? query.where(sql) : query
                end
            end
            klass
        end
    end
end
