#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-compounds.
#
# grit-compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-compounds. If not, see <https://www.gnu.org/licenses/>.
#++

module Grit::Compounds
  class CompoundPropertiesController < ApplicationController
    include Grit::Core::GritEntityController

    # TODO: remove in bugfix/compound-long-safe-name
    def properties_with_too_long_safe_name
      properties = CompoundProperty.detailed.where("length(safe_name) > 30")
      render json: { success: true, data: properties }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }
    end

    private

    def permitted_params
      [ "name", "safe_name", "description", "required", "compound_type_id", "data_type_id", "unit_id", "sort" ]
    end
  end
end
