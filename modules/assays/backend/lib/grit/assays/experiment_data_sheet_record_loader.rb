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


    # def self.fields(params)
    #   experiment_data_sheet_record_load_set_fields = Grit::Assays::ExperimentDataSheetRecordLoadSet.entity_fields.to_h { |item| [ item[:name], item.dup ] }
    #   experiment_data_sheet_record_load_set_fields["experiment_id"][:disabled] = true unless experiment_data_sheet_record_load_set_fields["experiment_id"].nil?
    #   experiment_data_sheet_record_load_set_fields["assay_data_sheet_definition_id"][:disabled] = true unless experiment_data_sheet_record_load_set_fields["assay_data_sheet_definition_id"].nil?

    #   [ *super(params), *experiment_data_sheet_record_load_set_fields.values ]
    # end

    # def self.show(load_set)
    #   experiment_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
    #   return load_set.as_json if experiment_load_set.nil?
    #   { **experiment_load_set.as_json, **load_set.as_json }
    # end

    # def self.create(params)
    #   data = read_data(params[:data].tempfile)
    #   separator = params[:separator]

    #   parsed_data = self.parse(data, separator)

    #   load_set = Grit::Core::LoadSet.new({
    #     name: params[:name],
    #     entity: "Grit::Assays::ExperimentDataSheetRecord",
    #     data: data,
    #     parsed_data: parsed_data,
    #     separator: separator,
    #     origin_id: params[:origin_id],
    #     status_id: Grit::Core::LoadSetStatus.find_by(name: "Mapping").id
    #   })
    #   load_set.save!

    #   record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.new({
    #     load_set_id: load_set.id,
    #     experiment_id: params[:experiment_id],
    #     assay_data_sheet_definition_id: params[:assay_data_sheet_definition_id]
    #   })
    #   record_load_set.save!

    #   load_set
    # end

    # def self.destroy(load_set)
    #   record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
    #   ExperimentDataSheetRecordLoader.drop_temporary_table(record_load_set)
    #   record_load_set.destroy
    #   super
    # end


    # def self.load_set_record_klass(record_load_set)
    #   sheet = Grit::Assays::AssayDataSheetDefinition.includes(assay_data_sheet_columns: [ :data_type ]).find(record_load_set.assay_data_sheet_definition_id)
    #   klass = Class.new(ActiveRecord::Base) do
    #     self.table_name = "ls_#{record_load_set.load_set_id}"
    #     @sheet = sheet

    #     def self.detailed(params = nil)
    #       query = self.unscoped
    #         .select("#{self.table_name}.id")
    #         .select("#{self.table_name}.errors")

    #       @sheet.assay_data_sheet_columns.each do |column|
    #         query = query.select("#{self.table_name}.#{column.safe_name}")
    #         if column.data_type.is_entity
    #           entity_klass = column.data_type.model
    #           query = query
    #             .joins("LEFT OUTER JOIN #{column.data_type.table_name} #{column.safe_name}__entities on #{column.safe_name}__entities.id = #{@sheet.table_name}.#{column.safe_name}")
    #           for display_property in entity_klass.display_properties do
    #             query = query
    #               .select("#{column.safe_name}__entities.#{display_property[:name]} as #{column.safe_name}__#{display_property[:name]}") unless entity_klass.display_properties.nil?
    #           end
    #         end
    #       end
    #       query
    #     end

    #     def self.less_detailed(experiment_id)
    #       query = self.unscoped.select("#{experiment_id} as experiment_id").select("'#{Grit::Core::User.current.login}' as created_by")
    #       @sheet.assay_data_sheet_columns.each do |column|
    #         query = query.select("#{self.table_name}.#{column.safe_name}")
    #       end
    #       query
    #     end
    #   end
    #   klass
    # end

    # def self.create_temporary_table(record_load_set)
    #   columns = AssayDataSheetColumn.where(assay_data_sheet_definition_id: record_load_set.assay_data_sheet_definition_id).order("sort ASC NULLS LAST")
    #   connection = ActiveRecord::Base.connection
    #   connection.drop_table "ls_#{record_load_set.load_set_id}", if_exists: true
    #   connection.create_table "ls_#{record_load_set.load_set_id}", id: false, if_not_exists: true do |t|
    #     t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
    #     columns.each do |column|
    #       if column.data_type.is_entity
    #         t.column column.safe_name, :bigint
    #       elsif column.data_type.name == "integer"
    #         t.column column.safe_name, :numeric, precision: 1000, scale: 0
    #       elsif column.data_type.name == "decimal"
    #         t.column column.safe_name, :numeric
    #       else
    #         t.column column.safe_name, column.data_type.sql_name
    #       end
    #     end
    #     t.column :number, :bigint
    #     t.column :errors, :jsonb
    #   end
    # end

    # def self.drop_temporary_table(record_load_set)
    #   ActiveRecord::Base.connection.drop_table "ls_#{record_load_set.load_set_id}", if_exists: true
    # end

    # def self.validate(load_set)
    #   record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
    #   load_set_entity_properties = Grit::Assays::ExperimentDataSheetRecord.entity_fields(assay_data_sheet_definition_id: record_load_set.assay_data_sheet_definition_id).filter { |f| f[:name] != "assay_data_sheet_definition_id" }

    #   data = load_set.parsed_data[1..]
    #   errors = []

    #   records = []

    #   Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
    #   Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)

    #   ExperimentDataSheetRecordLoader.create_temporary_table(record_load_set)
    #   load_set_record_klass = ExperimentDataSheetRecordLoader.load_set_record_klass(record_load_set)

    #   data.each_with_index do |datum, index|
    #     record = {
    #       number: index,
    #       errors: nil,
    #     }

    #     load_set_entity_properties.each do |entity_property|
    #       entity_property_name = entity_property[:name].to_s
    #       mapping = load_set.mappings[entity_property_name]
    #       next if mapping.nil?
    #       find_by = mapping["find_by"]
    #       header_index = mapping["header"].to_i unless mapping["header"].nil? or mapping["header"].blank?
    #       value = nil
    #       if mapping["constant"]
    #         value = mapping["value"]
    #       elsif !find_by.blank? and !datum[header_index].blank?
    #         begin
    #           field_entity = entity_property[:entity][:full_name].constantize
    #           value = field_entity.loader_find_by!(find_by, datum[header_index], options: entity_property[:entity][:options]).id
    #         rescue NameError
    #           record[:errors] ||= {}
    #           record[:errors][entity_property_name] = [ "#{entity_property[:entity][:name]}: No such model" ]
    #           value = 0
    #         rescue ActiveRecord::RecordNotFound
    #           record[:errors] ||= {}
    #           record[:errors][entity_property_name] = [ "could not find #{entity_property[:entity][:name]} with '#{find_by}' = #{datum[header_index]}" ]
    #           value = 0
    #         end
    #       elsif !header_index.nil?
    #         value = datum[header_index]
    #       end

    #       record[entity_property_name] = value

    #       if entity_property[:required] && value.nil?
    #         record[:errors] ||= {}
    #         record[:errors][entity_property_name] = [ "can't be blank" ]
    #       elsif entity_property[:type].to_s == "decimal" and !value.nil? and !value.blank? and !/^[+\-]?(\d+\.\d*|\d*\.\d+|\d+)([eE][+\-]?\d+)?$/.match?(value.to_s)
    #         record[:errors] ||= {}
    #         record[:errors][entity_property_name] = [ "is not a number" ]
    #       elsif entity_property[:type].to_s == "integer" and !value.nil? and !value.blank? and !/^[+\-]?\d+([eE][+]?\d+)?$/.match?(value.to_s)
    #         record[:errors] ||= {}
    #         record[:errors][entity_property_name] = [ "is not a integer" ]
    #       elsif entity_property[:type].to_s == "datetime" and !value.nil? and !value.blank?
    #         begin
    #           record[entity_property_name] = DateTime.parse(value)
    #         rescue
    #           record[:errors] ||= {}
    #           record[:errors][entity_property_name] = [ "Unable to parse datetime, please use YYYY/MM/DD HH:mm:ss or ISO 8601" ]
    #         end
    #       elsif entity_property[:type].to_s == "date" and !value.nil? and !value.blank?
    #         begin
    #           record[entity_property_name] = Date.parse(value)
    #         rescue
    #           record[:errors] ||= {}
    #           record[:errors][entity_property_name] = [ "Unable to parse date, please use YYYY/MM/DD or ISO 8601" ]
    #         end
    #       end
    #     end

    #     unless record[:errors].nil?
    #       errors.push({ index: index, datum: datum, errors: record[:errors] })
    #     end
    #     records.push record
    #   end
    #   load_set_record_klass.insert_all(records)
    #   { errors: errors }
    # end

    # def self.confirm(load_set)
    #   record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
    #   sheet = Grit::Assays::AssayDataSheetDefinition.includes(assay_data_sheet_columns: [ :data_type ]).find(record_load_set.assay_data_sheet_definition_id)

    #   insert = "WITH inserted_records as (INSERT INTO #{sheet.table_name}(experiment_id,created_by"
    #   sheet.assay_data_sheet_columns.each do |column|
    #     insert += ",#{column.safe_name}"
    #   end
    #   insert += ") "

    #   load_set_record_klass = ExperimentDataSheetRecordLoader.load_set_record_klass(record_load_set)
    #   insert += load_set_record_klass.less_detailed(record_load_set.experiment_id).where(errors: nil).to_sql
    #   insert += " RETURNING id) INSERT INTO grit_core_load_set_loaded_records(\"record_id\",\"load_set_id\",\"table\") SELECT inserted_records.id,#{load_set.id}, '#{sheet.table_name}' from inserted_records"

    #   ActiveRecord::Base.transaction do
    #     ActiveRecord::Base.connection.execute(insert)
    #     ExperimentDataSheetRecordLoader.drop_temporary_table(record_load_set)
    #   end
    # end

    # def self.rollback(load_set)
    #   record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
    #   load_set_entity = ExperimentDataSheetRecord.sheet_record_klass(record_load_set.assay_data_sheet_definition_id)
    #   load_set_entity.delete_by("id IN (SELECT record_id FROM grit_core_load_set_loaded_records WHERE grit_core_load_set_loaded_records.load_set_id = #{load_set.id})")
    #   Grit::Core::LoadSetLoadedRecord.delete_by(load_set_id: load_set.id)
    #   Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)
    # end

    # def self.mapping_fields(load_set)
    #   record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
    #   ExperimentDataSheetRecord.sheet_record_klass(record_load_set.assay_data_sheet_definition_id).entity_fields.filter { |f| f[:name] != "experiment_id" } # TMP BAD JOJO
    # end

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
