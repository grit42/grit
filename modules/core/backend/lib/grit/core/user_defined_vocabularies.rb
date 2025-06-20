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

require "grit/core/entity_manager"

module Grit::Core
  module UserDefinedVocabularies
    def self.setup(vocabulary)
      table_name = vocabulary.items_table_name
      table_name_with_schema = "public.#{table_name}"
      query = <<-SQL
CREATE TABLE IF NOT EXISTS #{table_name_with_schema} (
  id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
  created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
  updated_by character varying(30),
  created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp(6) without time zone,
  name character varying NOT NULL
);

ALTER TABLE ONLY #{table_name_with_schema} ADD CONSTRAINT #{table_name}_pkey PRIMARY KEY (id);
CREATE TRIGGER manage_stamps_#{table_name} BEFORE INSERT OR UPDATE ON #{table_name_with_schema} FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();
CREATE UNIQUE INDEX index_#{table_name} ON #{table_name_with_schema} USING btree (name);
      SQL

      ActiveRecord::Base.connection.execute(query) unless ActiveRecord::Base.connection.table_exists?(table_name_with_schema)

      Grit::Core::DataType.insert({
        name: vocabulary.name,
        description: vocabulary.name,
        is_entity: true,
        table_name: vocabulary.items_table_name
      }) unless Grit::Core::DataType.find_by(name: vocabulary.name).present?

      self.load(vocabulary)
    end

    def self.load(vocabulary)
      table_name = vocabulary.items_table_name

      modelKlass = Class.new(ActiveRecord::Base) do
        def self.vocabulary_definition=(definition)
          @vocabulary_definition = definition
        end

        def self.vocabulary_definition
          @vocabulary_definition
        end

        self.vocabulary_definition = vocabulary
        self.table_name = table_name
        include Grit::Core::GritEntityRecord

        def self.definition
          Grit::Core::Vocabulary.find(self.vocabulary_definition.id)
        end

        def self.display_name
          definition.name
        end

        def self.controller_path
          "grit/core/vocabulary_items/#{self.definition.id}"
        end

        display_column "name"

        entity_crud_with read: [],
          create: [ "Administrator" ],
          update: [ "Administrator" ],
          destroy: [ "Administrator" ]
      end
      const_set vocabulary.item_model_class_name, modelKlass
      Grit::Core::EntityManager.register(modelKlass)
    end

    def self.load_all
      vocabularies = Grit::Core::Vocabulary.table_exists? ?
        Grit::Core::Vocabulary.unscoped :
        []
      vocabularies.each do |vocabulary|
        setup(vocabulary)
      end
    end

    def self.teardown(vocabulary)
      table_name = vocabulary.items_table_name
      query = <<-SQL
DROP TABLE IF EXISTS #{table_name};
      SQL

      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute(query)

        Grit::Core::DataType.destroy_by(
          name: vocabulary.name
        )
      end

      Grit::Core::EntityManager.unregister("Grit::Core::UserDefinedVocabularies::#{vocabulary.item_model_class_name}")
      remove_const vocabulary.item_model_class_name
    end
  end
end
