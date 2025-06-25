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
  class VocabularyItemsController < ApplicationController
    include Grit::Core::GritEntityController

    private

    def get_scope(scope, params)
      klass_scope = Grit::Core::VocabularyItem.send(scope, params) if Grit::Core::VocabularyItem.respond_to?(scope)
      if klass_scope.nil?
        render json: {
          success: false,
          errors: "Grit::Core::VocabularyItem does not implement scope '#{scope}'"
        }, status: :bad_request
      end
      params[:vocabulary_id].nil? ? klass_scope : klass_scope.where(vocabulary_id: params[:vocabulary_id])
    end

    def permitted_params
      %i[ name description vocabulary_id ]
    end
  end
end
