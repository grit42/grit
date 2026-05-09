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

require "grit/core/filter_provider"

module Grit::Core::GritEntityController
  extend ActiveSupport::Concern
  include Grit::Core::Controller::Unforgeable
  include Grit::Core::Controller::Authenticated
  include Grit::Core::Controller::Authorized
  include Grit::Core::Controller::Readable
  include Grit::Core::Controller::Writable
end
