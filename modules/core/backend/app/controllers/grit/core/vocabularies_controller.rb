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

module Grit::Core
  class VocabulariesController < ApplicationController
    include Grit::Core::GritEntityController

    def vocabulary_ids_from_names
      names = params[:names]
      names ||= []

      vocabularies = Vocabulary.where(name: names)
      vocabulary_ids_by_name = vocabularies.each_with_object({}) { |vocabulary, memo| memo[vocabulary.name] = vocabulary.id }
      render json: { success: true, data: vocabulary_ids_by_name }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private

    def permitted_params
      %i[ name description ]
    end
  end
end
