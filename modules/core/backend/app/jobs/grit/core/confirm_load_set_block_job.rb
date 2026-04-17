module Grit::Core
  class ConfirmLoadSetBlockJob < ApplicationJob
    self.enqueue_after_transaction_commit = :always
    queue_as :default
    self.queue_adapter = SERIAL_ADAPTER

    def perform(load_set_block_id, current_user_id)
      RequestStore.store["current_user"] = Grit::Core::User.find(current_user_id)

      load_set_block = Grit::Core::LoadSetBlock.find(load_set_block_id)
      return unless load_set_block.status.name == "Confirming"

      ActiveRecord::Base.transaction do
        Grit::Core::EntityLoader.confirm_load_set_block(load_set_block)

        load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Succeeded").id
        load_set_block.save!
      end

    rescue ActiveRecord::RecordNotFound
      # Block or user deleted while queued — nothing to do.

    rescue StandardError => e
      logger.error "ConfirmLoadSetBlockJob failed for #{load_set_block_id}: #{e.message}"
      logger.error e.backtrace.join("\n")
      begin
        lsb = Grit::Core::LoadSetBlock.find(load_set_block_id)
        lsb.status_id = Grit::Core::LoadSetStatus.find_by_name("Errored").id
        lsb.error = e.message
        lsb.save!
      rescue StandardError
      end
      raise
    end
  end
end
