class RemoveBinaryDataType < ActiveRecord::Migration[7.2]
  def up
    Grit::Core::DataType.where(name: "binary").delete_all
  end
end
