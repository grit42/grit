class AddPublicationStatusToAssays < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_assays_assays, :publication_status_id, :bigint, null: false, default: Grit::Core::PublicationStatus.find_by(name: "Draft").id
    add_foreign_key :grit_assays_assays, :grit_core_publication_statuses, column: :publication_status_id
    add_index :grit_assays_assays, :publication_status_id
  end
end
