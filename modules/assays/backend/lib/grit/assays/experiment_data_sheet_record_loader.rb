#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-assays.
#
# grit-assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-assays. If not, see <https://www.gnu.org/licenses/>.
#++

require "grit/core/entity_loader"

module Grit::Assays
  class ExperimentDataSheetRecordLoader < Grit::Core::EntityLoader
    protected
    def self.block_fields(params)
      [ *super(params), *Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.entity_fields ]
    end

    def self.create(params)
      load_set = super

      Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.create!({
        load_set_block_id: load_set.load_set_blocks[0].id,
        experiment_id: params[:load_set_blocks]["0"]["experiment_id"],
        assay_data_sheet_definition_id: params[:load_set_blocks]["0"]["assay_data_sheet_definition_id"],
      })

      load_set
    end

    def self.show(load_set)
      load_set_blocks = Grit::Core::LoadSetBlock
        .detailed
        .select("grit_assays_experiment_data_sheet_record_load_set_blocks.experiment_id")
        .select("grit_assays_experiment_data_sheet_record_load_set_blocks.assay_data_sheet_definition_id")
        .joins("LEFT OUTER JOIN grit_assays_experiment_data_sheet_record_load_set_blocks on grit_assays_experiment_data_sheet_record_load_set_blocks.load_set_block_id = grit_core_load_set_blocks.id")
        .where(load_set_id: load_set.id)
      return load_set.as_json if load_set_blocks.empty?
      { **load_set.as_json, load_set_blocks: load_set_blocks }
    end

    def self.destroy(load_set)
      Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.destroy_by(load_set_block_id: load_set.load_set_blocks.map { |b| b.id })
      super
    end

    def self.base_record_props(load_set_block)
      experiment_data_sheet_record_load_set_block = Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      { "experiment_id" => experiment_data_sheet_record_load_set_block.experiment_id }
    end

    def self.rollback_block(load_set_block)
      experiment_data_sheet_record_load_set_block = Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      experiment_data_sheet_record_klass = experiment_data_sheet_record_load_set_block.assay_data_sheet_definition.sheet_record_klass
      experiment_data_sheet_record_klass.delete_by("id IN (SELECT record_id FROM grit_core_load_set_block_loaded_records WHERE grit_core_load_set_block_loaded_records.load_set_block_id = #{load_set_block.id})")
      Grit::Core::LoadSetBlockLoadedRecord.delete_by(load_set_block_id: load_set_block.id)
    end

    def self.block_mapping_fields(load_set_block)
      experiment_data_sheet_record_load_set_block = Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      experiment_data_sheet_record_klass = experiment_data_sheet_record_load_set_block.assay_data_sheet_definition.sheet_record_klass
      experiment_data_sheet_record_klass.entity_fields
    end

    def self.block_loading_fields(load_set_block)
      experiment_data_sheet_record_load_set_block = Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      experiment_data_sheet_record_klass = experiment_data_sheet_record_load_set_block.assay_data_sheet_definition.sheet_record_klass
      experiment_data_sheet_record_klass.entity_fields(with_experiment_id: true)
    end

    def self.loaded_data_columns(load_set)
      record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
      ExperimentDataSheetRecord.sheet_record_klass(record_load_set.assay_data_sheet_definition_id).entity_columns.filter { |f| f[:name] != "experiment_id" }
    end

    def self.block_entity(load_set_block)
      experiment_data_sheet_record_load_set_block = Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      experiment_data_sheet_record_klass = experiment_data_sheet_record_load_set_block.assay_data_sheet_definition.sheet_record_klass
    end

    def self.block_loaded_data_columns(load_set_block)
      experiment_data_sheet_record_load_set_block = Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      experiment_data_sheet_record_klass = experiment_data_sheet_record_load_set_block.assay_data_sheet_definition.sheet_record_klass
      experiment_data_sheet_record_klass.entity_columns
    end

    def self.block_entity_info(load_set_block)
      record_load_set_block = Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      model = load_set_block.load_set.entity.constantize
      {
        full_name: model.name,
        name: model.name.demodulize.underscore.humanize,
        plural: model.name.demodulize.underscore.humanize.pluralize,
        path: "grit/assays/assay_data_sheet_definitions/#{record_load_set_block.assay_data_sheet_definition_id}/experiment_data_sheet_records",
        dictionary: false
      }
    end
  end
end
