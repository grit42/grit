module Grit::Core
  class InitializeLoadSetBlockJob < ApplicationJob
    self.enqueue_after_transaction_commit = :always
    queue_as :default

    SEMAPHORE = Concurrent::Semaphore.new(1)
    LOCK_TIMEOUT = 300

    def perform(load_set_block_id, current_user_id)
      RequestStore.store["current_user"] = Grit::Core::User.find(current_user_id)

      load_set_block = Grit::Core::LoadSetBlock.find(load_set_block_id)
      return unless load_set_block.status.name == "Created"

      load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Initializing").id
      load_set_block.save!

      Rails.logger.info { "Waiting for semaphore to initialize load set block #{load_set_block_id}" }
      executed = SEMAPHORE.try_acquire(1, LOCK_TIMEOUT) do
        load_set_block.create_tables
        true
      end

      raise "Timed out: Could not acquire lock for load set block #{load_set_block_id} within 5 minutes" unless executed

      load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Mapping").id
      load_set_block.save!

    rescue ActiveRecord::RecordNotFound
      # Block or user deleted while queued — nothing to do.

    rescue StandardError => e
      logger.error "InitializeLoadSetBlockJob failed for #{load_set_block_id}: #{e.message}"
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
