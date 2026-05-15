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

module Grit::Core::Controller::Authorized
  extend ActiveSupport::Concern
  include Grit::Core::Controller::Authenticated

  included do
    private

    def get_model(params)
      return model_override(params) if respond_to?(:model_override)
      controller_path.classify.constantize
    end

    def check_read
      klass = get_model(params)
      render json: { success: false, errors: "You do not have the permissions required to read #{klass.name}" }, status: :forbidden if klass.entity_crud[:read].nil? or !current_user.permission?(klass.entity_crud[:read])
    end

    def check_write
      klass = get_model(params)
      render json: { success: false, errors: "You do not have the permissions required to write #{klass.name}" }, status: :forbidden if klass.entity_crud[:write].nil? or !current_user.permission?(klass.entity_crud[:write])
    end
  end
end
