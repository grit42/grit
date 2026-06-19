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


require "rails_helper"

RSpec.describe Grit::Core do
  it "has a version number" do
    expect(Grit::Core::VERSION).to be_truthy
  end

  describe "LIKE filter operators — percent sign escaping (Fix #2)" do
    let!(:record_with_percent)    { create(:grit_test_entity, name: "50%") }
    let!(:record_without_percent) { create(:grit_test_entity, name: "50abc") }

    def filter_results(operator, value)
      sql = Grit::Core::FilterProvider.execute("string", operator, "test_entities.name", value.dup)
      Grit::TestEntity.where(sql)
    end

    it "contains: treats % as a literal character, not a wildcard" do
      results = filter_results("contains", "50%")
      expect(results).to include(record_with_percent)
      expect(results).not_to include(record_without_percent)
    end

    it "not_contains: treats % as a literal character" do
      results = filter_results("not_contains", "50%")
      expect(results).to include(record_without_percent)
      expect(results).not_to include(record_with_percent)
    end

    it "starts_with: treats % as a literal character" do
      results = filter_results("starts_with", "50%")
      expect(results).to include(record_with_percent)
      expect(results).not_to include(record_without_percent)
    end

    it "ends_with: treats % as a literal character" do
      results = filter_results("ends_with", "50%")
      expect(results).to include(record_with_percent)
      expect(results).not_to include(record_without_percent)
    end

    it "like: treats % as a literal character" do
      results = filter_results("like", "50%")
      expect(results).to include(record_with_percent)
      expect(results).not_to include(record_without_percent)
    end
  end
end
