module Grit::Core
    class ApplicationJob < ActiveJob::Base
        SERIAL_ADAPTER = ActiveJob::QueueAdapters::AsyncAdapter.new(
          min_threads: 1,
          max_threads: 1,
          idletime: 600.seconds
        )

        retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3
        discard_on ActiveJob::DeserializationError
    end
end
