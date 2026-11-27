#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-core.
#
# grit-core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-core. If not, see <https://www.gnu.org/licenses/>.
#++

# Sends emails without letting a mail failure (bad SMTP credentials, unreachable
# server, ...) abort the surrounding request. The caller decides how to report it:
# a detailed warning for administrators, a generic message for anonymous users.
module Grit::Core::Controller::MailDelivery
  extend ActiveSupport::Concern

  private
    # Delivers +message+ immediately. Returns nil when it was sent (or mail is not
    # configured), otherwise logs the failure and returns the exception.
    def deliver_mail(message, description)
      message.deliver_now
      nil
    rescue StandardError => e
      logger.error "#{description} could not be sent: #{e.class}: #{e.message}"
      e
    end

    # Warning for administrators, including the SMTP reply. Nil when +error+ is nil.
    def mail_failure_warning(error, what, advice)
      return nil if error.nil?

      "#{what} could not be sent (#{error.class}: #{error.message.strip}). #{advice}"
    end
end
