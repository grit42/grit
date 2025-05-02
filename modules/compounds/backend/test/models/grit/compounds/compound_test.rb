require "test_helper"

module Grit::Compounds
  class CompoundTest < ActiveSupport::TestCase
    test "entity properties should include dynamic properties" do
      assert_not false do
        property_names = Grit::Compounds::Compound.entity_properties.map { |p| p[:name] }
        [ "name", "number", "origin_id", "compound_type_id", "one", "two" ].all? { |p| property_names.include?(p) }
      end
    end

    test "entity properties should include only dynamic properties of the specified type" do
      assert_not false do
        property_names = Grit::Compounds::Compound.entity_properties(compound_type_id: grit_compounds_compound_types(:reagent).id).map { |p| p[:name] }
        [ "one", "two" ].all? { |p| property_names.include?(p) }
      end
    end
  end
end
