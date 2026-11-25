# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.

module MailHelpers
  SMTP_AUTH_REPLY = "535 5.7.8 Username and Password not accepted"

  # Makes Grit::Core::Mailer.<mail> fail on delivery the way a server with bad
  # SMTP credentials does.
  def stub_smtp_authentication_failure(mail)
    error = Net::SMTPAuthenticationError.new(Net::SMTP::Response.parse(SMTP_AUTH_REPLY))
    message = instance_double(ActionMailer::MessageDelivery)
    allow(message).to receive(:deliver_now).and_raise(error)
    allow(Grit::Core::Mailer).to receive(mail).and_return(message)
  end
end

RSpec.configure do |config|
  config.include MailHelpers, type: :request
end
