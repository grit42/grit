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

RSpec.describe Grit::Core::Vocabulary, type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

  before(:each) do
    Grit::Core::UserSession.create(admin)
  end

  let!(:vocabulary) { create(:grit_core_vocabulary, name: "test_vocab") }

  before(:each) do
    Grit::Core::Vocabulary.maintain_data_types
  end

  it "creating a vocabulary creates the corresponding data type" do
    expect(Grit::Core::DataType.find_by(name: "test_vocab")).to be_present
  end

  it "modifying a vocabulary updates the corresponding data type" do
    description = "The answer to life, the universe and everything"
    vocabulary.update(name: "42", description: description)
    expect(Grit::Core::DataType.find_by(name: "42").description).to eq(description)
  end

  it "deleting a vocabulary deletes the corresponding data type" do
    vocabulary.destroy
    expect(Grit::Core::DataType.find_by(name: "test_vocab")).not_to be_present
  end
end
