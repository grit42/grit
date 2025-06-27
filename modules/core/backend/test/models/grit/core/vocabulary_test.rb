require "test_helper"

module Grit::Core
  class VocabularyTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      UserSession.create(grit_core_users(:admin))
      Grit::Core::Vocabulary.maintain_data_types
    end

    test "creating a vocabulary creates the corresponding data type" do
      assert Grit::Core::DataType.find_by(name: "one").present?
    end

    test "modifying a vocabulary updates the corresponding data type" do
      @vocabulary = Grit::Core::Vocabulary.find_by(name: "one")
      description = "The answer to life, the universe and everything"
      @vocabulary.update(name: "42", description: description)
      assert Grit::Core::DataType.find_by(name: "42").description == description
    end

    test "deleting a vocabulary deletes the corresponding data type" do
      @vocabulary = Grit::Core::Vocabulary.find_by(name: "one")
      @vocabulary.destroy()
      assert_not Grit::Core::DataType.find_by(name: "one").present?
    end
  end
end
