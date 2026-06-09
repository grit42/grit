module Grit::Core
  class ValidateLoadSetBlockJob < ApplicationJob
    self.enqueue_after_transaction_commit = :always
    queue_as :validations

    def perform(load_set_block_id, current_user_id)
      RequestStore.store["current_user"] = Grit::Core::User.find(current_user_id)

      load_set_block = Grit::Core::LoadSetBlock.find(load_set_block_id)

      # Idempotency guard: bail if status has already moved on (cancel, duplicate enqueue, etc.)
      return unless load_set_block.status.name == "Validating"

      validation_result = Grit::Core::EntityLoader.validate_load_set_block(load_set_block)
      load_set_block.has_errors   = validation_result[:has_errors]
      load_set_block.has_warnings = validation_result[:has_warnings]

      status_name = load_set_block.has_errors ? "Invalidated" : "Validated"
      load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name(status_name).id
      load_set_block.save!

    rescue ActiveRecord::RecordNotFound
      # Block was deleted while job was queued — nothing to do.

    rescue StandardError => e
      logger.error "ValidateLoadSetBlockJob failed for #{load_set_block_id}: #{e.message}"
      logger.error e.backtrace.join("\n")
      begin
        lsb = Grit::Core::LoadSetBlock.find(load_set_block_id)
        lsb.status_id = Grit::Core::LoadSetStatus.find_by_name("Errored").id
        lsb.error = e.message
        lsb.save!
      rescue StandardError
      end
      raise  # re-raise so SolidQueue records it in solid_queue_failed_executions
    end
  end
end
