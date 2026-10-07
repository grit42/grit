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

# How schema, table and column definitions refuse a change: a guard adds to
# `errors` and throws :abort.
#
#   - Save: guards are validations, so `valid?` agrees with `save`, and `save!`
#     raises RecordInvalid.
#   - Destroy: Rails has no validation step, so guards are `before_destroy`
#     callbacks; `destroy!` raises RecordNotDestroyed carrying their messages.
#   - Commit and revert: `SchemaDefinition` raises CommitError.
module Grit::Core::Model::DynamicSchema::Refusal
  extend ActiveSupport::Concern

  # What `SchemaDefinition#commit!` validates every definition in: `on: :update`
  # validations run, `except_on: :schema_commit` ones (`check_can_modify`) don't.
  COMMIT_VALIDATION_CONTEXT = %i[update schema_commit].freeze

  included do
    # So `destroy!` reports this destroy's refusals only.
    before_destroy -> { errors.clear }, prepend: true
  end

  # Runs before every save and destroy; a no-op for includers to override (call
  # `super`). Refuse by adding to `errors`, throwing :abort to skip what follows.
  # Structural changes to a committed schema are refused regardless.
  def check_can_modify
  end

  def destroy!
    super
  rescue ActiveRecord::RecordNotDestroyed => e
    raise unless e.record.equal?(self) && errors.any?
    raise ActiveRecord::RecordNotDestroyed.new(errors.full_messages.join("; "), self)
  end

  private

  # `check_can_modify` as a guard: refused if it threw :abort or added errors,
  # with a generic message if it gave none.
  def refuse_unless_can_modify
    count = errors.count
    allowed = catch(:abort) do
      check_can_modify
      true
    end
    return if allowed && errors.count == count
    errors.add(:base, "#{self.class.model_name.human} #{identifier} cannot be modified") if errors.count == count
    throw :abort
  end
end
