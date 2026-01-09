module Grit::Assays
  class ExperimentDataModelMigrationError < ApplicationRecord
    include Grit::Core::GritEntityRecord

    entity_crud_with read: [ "Administrator", "AssayAdministrator" ],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]
  end
end
