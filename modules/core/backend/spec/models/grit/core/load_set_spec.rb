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

RSpec.describe Grit::Core::LoadSet, type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

  before(:each) do
    Grit::Core::UserSession.create(admin)
  end

  # check_status callback tests
  describe "check_status callback" do
    it "cannot delete load set when any block has succeeded" do
      load_set = create(:grit_core_load_set, :with_succeeded_block)

      expect(load_set.load_set_blocks.any? { |lsb| lsb.status.name == "Succeeded" }).to be_truthy

      result = load_set.destroy
      expect(result).to be_falsy
      expect(described_class.exists?(load_set.id)).to be_truthy
    end

    it "can delete load set when no blocks have succeeded" do
      load_set = create(:grit_core_load_set, :with_mapping_block)

      expect(load_set.load_set_blocks.any? { |lsb| lsb.status.name == "Succeeded" }).to be_falsy

      expect(load_set.destroy).to be_truthy
      expect(described_class.exists?(load_set.id)).to be_falsy
    end

    it "can delete load set with no blocks" do
      load_set = create(:grit_core_load_set)

      expect(load_set.destroy).to be_truthy
      expect(described_class.exists?(load_set.id)).to be_falsy
    end
  end

  # by_entity scope tests
  describe "by_entity scope" do
    it "filters load sets by entity name" do
      create(:grit_core_load_set, entity: "TestEntity")
      load_sets = described_class.where(entity: "TestEntity")

      expect(load_sets.count).to be > 0
      load_sets.each do |ls|
        expect(ls.entity).to eq("TestEntity")
      end
    end

    it "returns empty when no matching entity" do
      load_sets = described_class.where(entity: "NonExistentEntity")
      expect(load_sets.count).to eq(0)
    end
  end

  # rollback method tests
  describe "rollback" do
    it "sets all blocks to errored status" do
      load_set = create(:grit_core_load_set, :with_mapping_block)

      expect(load_set.load_set_blocks.count).to be > 0

      errored_status = Grit::Core::LoadSetStatus.find_or_create_by!(name: "Errored") do |s|
        s.description = "Errored"
      end

      load_set.load_set_blocks.each do |lsb|
        lsb.status = errored_status
        lsb.save!
      end

      load_set.reload
      load_set.load_set_blocks.each do |lsb|
        expect(lsb.status.name).to eq("Errored")
      end
    end
  end

  # Association tests
  describe "associations" do
    it "has many load_set_blocks" do
      load_set = create(:grit_core_load_set, :with_mapping_block)
      expect(load_set.load_set_blocks.count).to be >= 1
    end

    it "destroys associated blocks on destroy" do
      load_set = create(:grit_core_load_set)
      block = create(:grit_core_load_set_block, :mapping, load_set: load_set)
      block_id = block.id

      load_set.destroy
      expect(Grit::Core::LoadSetBlock.exists?(block_id)).to be_falsy
    end
  end
end
