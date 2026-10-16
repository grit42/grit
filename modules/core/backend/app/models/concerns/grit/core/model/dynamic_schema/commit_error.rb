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

# Raised by `SchemaDefinition#commit!` and `#revert_to_draft!`, carrying every
# reason at once. The non-bang forms copy `messages` onto `errors[:base]`.
class Grit::Core::Model::DynamicSchema::CommitError < StandardError
  attr_reader :messages

  def initialize(messages)
    @messages = Array(messages)
    super(@messages.join("; "))
  end
end
