#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-core.
#
# grit-core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-core. If not, see <https://www.gnu.org/licenses/>.
#++

require "grit/core/filter_provider"

module Grit::Core::Controller::Readable
  extend ActiveSupport::Concern
  include Grit::Core::Controller::Authenticated

  included do
    before_action :check_read, only: %i[ index show export ] if self.include? Grit::Core::Controller::Authorized

    def filter_and_sort_raw_sql(scope, filter, sort)
      klass = get_model(params)

      scope = klass.unscoped.select("sub.*").from("(#{scope}) sub")

      sort.each do |sort_item|
        scope = scope.order(ActiveRecord::Base.send(:sanitize_sql_array, [ "sub.#{quote_sort_property(sort_item["property"])} #{sort_direction(sort_item["direction"])}" ]))
      end

      filter.each do |filter_item|
        scope = scope.where(Grit::Core::FilterProvider.execute(filter_item["type"], filter_item["operator"], "sub.#{quote_sort_property(filter_item["property"])}", filter_item["value"]))
      end

      scope
    end

    def filter_and_sort_active_record_relation(scope, filter, sort)
      select_values_map = scope.select_values.each_with_object({}) do |v, memo|
        alias_column = /^(?<value>.+) (as|AS) (?<alias>.+)$/.match(v)
        if alias_column
          memo[alias_column[:alias]] = alias_column[:value]
        else
          memo[v.split(".")[1]] = v
        end
      end


      default_order_values = scope.order_values
      scope = scope.unscope(:order)
      sort.each do |sort_item|
        scope = scope.order(ActiveRecord::Base.send(:sanitize_sql_array, [ "#{select_values_map[sort_item["property"]]} #{sort_direction(sort_item["direction"])} NULLS LAST" ]))
      end
      scope.order_values = [ *scope.order_values, *default_order_values ]

      filter.each do |filter_item|
        scope = scope.where(Grit::Core::FilterProvider.execute(filter_item["type"], filter_item["operator"], select_values_map[filter_item["property"]], filter_item["value"]))
      end
      scope
    end

    def filter_and_sort_scope(scope, filter, sort)
      return filter_and_sort_raw_sql(scope, filter, sort) if scope.is_a?(String)
      filter_and_sort_active_record_relation(scope, filter, sort)
    end

    def filter_and_sort_index(params)
      scope = get_scope(params[:scope] || "detailed", params)
      return if scope.nil?

      sort = params[:sort].nil? ? [] : ActiveSupport::JSON.decode(params[:sort])
      filter = params[:filter].nil? ? [] : ActiveSupport::JSON.decode(params[:filter])
      filter_and_sort_scope(scope, filter, sort)
    end

    def index_entity(params)
      filter_and_sort_index(params)
    end

    def index
      limit = params[:limit] ||= 50
      offset = params[:offset] ||= 0

      query = index_entity(params)
      return if query.nil?

      @record_count = query.count(:all)
      @record_count = @record_count.values.sum unless @record_count.is_a? Integer
      @records = limit.to_i != -1 ? query.limit(limit).offset(offset) : query.all
      render json: { success: true, data: @records, cursor: offset.to_i + @records.length, total: @record_count }
    end

    def csv_from_query(query)
      csv_sql = "COPY (#{query.to_sql}) TO STDOUT WITH DELIMITER ',' CSV HEADER"

      temp_file = Tempfile.new("#{get_model(params).name.demodulize.underscore}.csv")

      ActiveRecord::Base.connection.raw_connection.copy_data(csv_sql) do
        row = ActiveRecord::Base.connection.raw_connection.get_copy_data
        temp_file.write(row.upcase.force_encoding("UTF-8").split(",").map { |h| h.gsub(/_+/, " ").humanize }.join(","))
        while (row = ActiveRecord::Base.connection.raw_connection.get_copy_data)
          temp_file.write(neutralize_formula_injection(row.force_encoding("UTF-8")))
        end
      end

      temp_file.rewind
      temp_file
    end

    def index_entity_for_export(params)
      index_entity(params)
    end

    def export_file_name
      "#{get_model(params).name.demodulize.underscore}.csv"
    end

    def export
      query = index_entity_for_export(params)
      return if query.nil?

      if params[:columns]&.length
        klass = get_model(params)
        query = klass.unscoped.select(*quote_export_columns(klass, params[:columns])).from(query, :sub)
      end

      file = csv_from_query(query)

      send_data file.read, filename: export_file_name, type: "text/csv"
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def show_entity(params)
      scope = get_scope(params[:scope] || "detailed", params)
      return if scope.nil?
      scope.find(params[:id])
    end

    def show
      @record = show_entity(params)
      return if performed?

      if @record.nil?
        render json: { success: false, errors: "Not found" }
      else
        render json: { success: true, data: @record }
      end
    rescue ActiveRecord::RecordNotFound => e
      render json: { success: false, errors: "Not found" }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private

    def sort_direction(direction)
      direction.to_s.strip.casecmp("desc").zero? ? "DESC" : "ASC"
    end

    def quote_sort_property(property)
      ActiveRecord::Base.connection.quote_column_name(property.to_s)
    end

    def get_model(params)
      return model_override(params) if respond_to?(:model_override)
      controller_path.classify.constantize
    end

    def quote_export_columns(klass, columns)
      columns.map { |c| klass.connection.quote_column_name(c) }
    end

    def neutralize_formula_injection(row)
      cells = CSV.parse_line(row)
      return row if cells.nil?
      CSV.generate_line(cells.map { |cell| cell&.match?(/\A[=+\-@\t\r]/) ? "'#{cell}" : cell })
    end

    def get_scope(scope, params)
      klass = get_model(params)
      klass_scope = klass.send(scope, params) if klass.entity_scope?(scope)
      render json: { success: false, errors: "#{klass.name} does not implement scope '#{scope}'" }, status: :bad_request if klass_scope.nil?
      klass_scope
    end
  end
end
