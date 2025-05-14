Rails.application.configure do
  config.active_record.schema_format = :sql  # Rails cannot dump DB to schema.db because of use of special column type (for instance RDKit mol type)
end
