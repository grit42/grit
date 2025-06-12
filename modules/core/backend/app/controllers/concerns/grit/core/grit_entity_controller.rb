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

module Grit::Core::GritEntityController
  extend ActiveSupport::Concern

  included do
    include ActionController::Cookies
    include ActionController::RequestForgeryProtection

    protect_from_forgery with: :null_session, prepend: true,
    if: proc { |c| c.request.format =~ %r{application/json} }

    helper_method :current_user_session, :current_user

    before_action :set_csrf_token
    before_action :require_user
    before_action :check_read, only: %i[ index show ]
    before_action :check_create, only: :create
    before_action :check_update, only: :update
    before_action :check_destroy, only: :destroy

    def set_csrf_token
      cookies["csrf-token"] = form_authenticity_token
    end

    def filter_and_sort_raw_sql(scope, filter, sort)
      klass = controller_path.classify.constantize

      scope = klass.unscoped.select("sub.*").from("(#{scope}) sub")

      sort.each do |sort_item|
        scope = scope.order(ActiveRecord::Base.send(:sanitize_sql_array, [ "sub.#{sort_item["property"]} #{sort_item["direction"]}" ]))
      end

      filter.each do |filter_item|
        scope = scope.where(Grit::Core::FilterProvider.execute(filter_item["type"], filter_item["operator"], "sub.#{filter_item["property"]}", filter_item["value"]))
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

      sort.each do |sort_item|
        scope = scope.order(ActiveRecord::Base.send(:sanitize_sql_array, [ "#{select_values_map[sort_item["property"]]} #{sort_item["direction"]} NULLS LAST" ]))
      end

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
      @records = limit.to_i != -1 ? query.limit(limit).offset(offset) : query.all
      render json: { success: true, data: @records, cursor: offset.to_i + @records.length, total: @record_count }
    end

    def csv_from_query(query)
      csv_sql = "COPY (#{query.to_sql}) TO STDOUT WITH DELIMITER ',' CSV HEADER"

      temp_file = Tempfile.new("#{controller_path.classify.demodulize.underscore}.csv")

      ActiveRecord::Base.connection.raw_connection.copy_data(csv_sql) do
        row = ActiveRecord::Base.connection.raw_connection.get_copy_data
        temp_file.write(row.upcase.force_encoding("UTF-8").split(",").map { |h| h.gsub(/_+/, " ").humanize }.join(","))
        while (row = ActiveRecord::Base.connection.raw_connection.get_copy_data)
          temp_file.write(row.force_encoding("UTF-8"))
        end
      end

      temp_file.rewind
      temp_file
    end

    def index_entity_for_export(params)
      index_entity(params)
    end

    def export
      query = index_entity_for_export(params)
      return if query.nil?

      if params[:columns]&.length
        klass = controller_path.classify.constantize
        query = klass.unscoped.select(*params[:columns]).from(query, :sub)
      end

      file = csv_from_query(query)

      send_data file.read, filename: "#{controller_path.classify.demodulize.underscore}.csv", type: "text/csv"
    end

    def show_existing_entity(params)
      scope = get_scope(params[:scope] || "detailed", params)
      return if scope.nil?
      scope.find(params[:id])
    end

    def show_new_entity
      controller_path.classify.constantize.new()
    end

    def show_entity(params)
      params[:id] == "new" ? show_new_entity : show_existing_entity(params)
    end

    def show
      @record = show_entity(params)
      if @record.nil?
        render json: { success: false, errors: "Not found" } unless @record.nil?
      else
        render json: { success: true, data: @record } unless @record.nil?
      end
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def create
      klass = controller_path.classify.constantize
      permitted_params = params.permit(self.permitted_params)
      @record = klass.new(permitted_params)

      if @record.save
        render json: { success: true, data: @record }, status: :created, location: @record
      else
        render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
      end
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def update
      klass = controller_path.classify.constantize
      @record = klass.find(params[:id])
      permitted_params = params.permit(self.permitted_params)

      if @record.update(permitted_params)
        scope = get_scope(params[:scope] || "detailed", params)
        @record = scope.find(params[:id])
        render json: { success: true, data: @record }
      else
        render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
      end
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def destroy
      klass = controller_path.classify.constantize
      klass.destroy(params[:id].split(","))
      render json: { success: true }
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private

    def check_read
      klass = controller_path.classify.constantize
      render json: { success: false, errors: "You do not have the permissions required to read #{controller_path.classify}" }, status: :forbidden if klass.entity_crud[:read].nil? or (!klass.entity_crud[:read].length.zero? and !current_user.one_of_these_roles?(klass.entity_crud[:read]))
    end

    def check_create
      klass = controller_path.classify.constantize
      render json: { success: false, errors: "You do not have the permissions required to create #{controller_path.classify}" }, status: :forbidden if klass.entity_crud[:create].nil? or (!klass.entity_crud[:create].length.zero? and !current_user.one_of_these_roles?(klass.entity_crud[:create]))
    end

    def check_update
      klass = controller_path.classify.constantize
      render json: { success: false, errors: "You do not have the permissions required to update #{controller_path.classify}" }, status: :forbidden  if klass.entity_crud[:update].nil? or (!klass.entity_crud[:update].length.zero? and !current_user.one_of_these_roles?(klass.entity_crud[:update]))
    end

    def check_destroy
      klass = controller_path.classify.constantize
      render json: { success: false, errors: "You do not have the permissions required to delete #{controller_path.classify}" }, status: :forbidden if klass.entity_crud[:destroy].nil? or (!klass.entity_crud[:destroy].length.zero? and !current_user.one_of_these_roles?(klass.entity_crud[:destroy]))
    end

    def get_scope(scope, params)
      klass = controller_path.classify.constantize
      klass_scope = klass.send(scope, params) if klass.respond_to?(scope)
      render json: { success: false, errors: "#{controller_path.classify} does not implement scope '#{scope}'" }, status: :bad_request if klass_scope.nil?
      klass_scope
    end

    def current_user_session
      return @current_user_session if defined?(@current_user_session)
      @current_user_session = Grit::Core::UserSession.find
    end

    def current_user
      @current_user = Grit::Core::User.find_by(auth_token: params[:token]) if params[:token].present?
      return @current_user if defined?(@current_user)
      @current_user = current_user_session && current_user_session.user
    end

    def require_user
      return if current_user

      render json: { success: false, errors: "Not logged in" }, status: :unauthorized
    end

    def require_no_user
      return unless current_user

      false
    end

    def require_administrator
      return true if Grit::Core::User.current.role?("Administrator")

      render json: { success: false, errors: "Insufficient roles" }, status: :unauthorized
    end
  end
end
