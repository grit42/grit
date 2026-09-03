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

module Grit::Core::Model::DynamicSchema::ValidIdentifier
    extend ActiveSupport::Concern

    included do
        validates :identifier, format: { with: /\A[a-zA-Z0-9_]*\z/, message: "should contain only letters, numbers and underscores" }
        validate :identifier_not_conflict
    end

    def identifier_not_conflict
        return unless self.identifier_changed?
        if ActiveRecord::Base.instance_methods.include?(self.identifier.to_sym) || [ "id", "created_at", "created_by", "updated_at", "updated_by", "experiment_id" ].include?(self.identifier)
            errors.add("identifier", "is a reserved keyword and cannot be used as identifier")
        end
    end
end
