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
    before_action :check_read, only: %i[ index show ]
    before_action :check_create, only: :create
    before_action :check_update, only: :update
    before_action :check_destroy, only: :destroy

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
  end
end
