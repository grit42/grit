module Grit::Core
    class ApplicationJob < ActiveJob::Base
        retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3
        discard_on ActiveJob::DeserializationError
    end
end
