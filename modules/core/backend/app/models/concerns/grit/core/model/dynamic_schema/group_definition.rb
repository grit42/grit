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

module Grit::Core::Model::DynamicSchema::GroupDefinition
  extend ActiveSupport::Concern
  include Grit::Core::Model::DynamicSchema::ValidIdentifier

  included do
    class_attribute :table_definitions_association, default: nil
    class_attribute :before_drop_tables, default: []
    class_attribute :after_create_tables, default: []

    before_save :check_can_modify
    after_update :rename_tables
    before_destroy :check_can_modify

    validates :identifier, presence: true
    validates :identifier, length: { minimum: 2, maximum: 15 }
    validates :identifier, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :identifier, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }

    def check_can_modify
      raise "Cannot modify TableDefinition #{self.id}"
    end

    def rename_tables
      return unless identifier_previously_changed?
      table_definitions.each { |d| d.rename_table identifier_previously_was }
    end
  end

  def table_definitions
    self.send(self.table_definitions_association)
  end

  def create_tables
    self.table_definitions.each(&:create_table)
    self.after_create_tables.each { |cb| self.send(cb) }
  end

  def drop_tables
    self.before_drop_tables.each { |cb| self.send(cb) }
    self.table_definitions.each(&:drop_table)
  end

  class_methods do
    def has_many_table_definitions table_definitions_association
        has_many table_definitions_association, dependent: :destroy
        self.table_definitions_association = table_definitions_association
    end
  end
end
