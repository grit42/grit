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

module Grit::Assays
  class AssayModel < ApplicationRecord
    include Grit::Core::GritEntityRecord

    before_destroy :drop_tables
    belongs_to :assay_type
    belongs_to :publication_status, class_name: "Grit::Core::PublicationStatus"
    has_many :assay_model_metadata, dependent: :destroy
    has_many :assay_data_sheet_definitions, dependent: :destroy
    has_many :experiments, dependent: :destroy

    before_save :check_publication_status

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]

    def self.published(params)
      self.detailed(params).where("grit_core_publication_statuses__.name = 'Published'")
    end

    def create_tables
      assay_data_sheet_definitions.each(&:create_table)
    end

    def drop_tables
      assay_data_sheet_definitions.each(&:drop_table)
    end

    private
      def check_publication_status
        return if publication_status_changed?
        raise "Cannot modify a published Assay Model" if publication_status.name === "Published"
      end
  end
end
