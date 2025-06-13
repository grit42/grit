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

module Grit
  module Core
    class Mailer < ApplicationMailer
      def deliver_activation_instructions(user)
        @server_url = ENV.fetch("GRIT_SERVER_URL", nil)
        @token = user.activation_token

        mail(
          from: ENV.fetch("SMTP_USER", nil),
          to: user.email,
          subject: "Activation Instructions",
          content_type: "text/html"
        )
      end

      def deliver_reactivation_instructions(user)
        @server_url = ENV.fetch("GRIT_SERVER_URL", nil)
        @token = user.activation_token

        mail(
          from: ENV.fetch("SMTP_USER", nil),
          to: user.email,
          subject: "Activation Instructions",
          content_type: "text/html"
        )
      end

      def deliver_two_factor_instructions(user)
        @token = user.two_factor_token

        mail(
          from: ENV.fetch("SMTP_USER", nil),
          to: user.email,
          subject: "Two factor token",
          content_type: "text/html"
        )
      end

      def deliver_password_reset(user)
        @server_url = ENV.fetch("GRIT_SERVER_URL", nil)
        @token = user.forgot_token

        mail(
          from: ENV.fetch("SMTP_USER", nil),
          to: user.email,
          subject: "Password reset instructions",
          content_type: "text/html"
        )
      end
    end
  end
end
