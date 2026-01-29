class AddPublicationStatusToAssayModels < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_assays_assay_models, :publication_status_id, :bigint, null: false
    add_foreign_key :grit_assays_assay_models, :grit_core_publication_statuses, column: :publication_status_id
    add_index :grit_assays_assay_models, :publication_status_id
  end
end
