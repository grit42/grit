require "active_support"
require "active_record"
require_relative "../../app/models/concerns/grit/core/grit_entity_record.rb"
require_relative "../../app/controllers/concerns/grit/core/grit_entity_controller.rb"
require_relative "../../app/models/grit/core/application_record.rb"
require_relative "../../app/models/grit/core/vocabulary.rb"

# CREATE TABLE public.grit_core_vocabularies (
#     id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
#     created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
#     created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
#     updated_by character varying(30),
#     updated_at timestamp(6) without time zone,
#     name character varying NOT NULL
# );

# ALTER TABLE ONLY public.grit_core_vocabularies
#     ADD CONSTRAINT grit_core_vocabularies_pkey PRIMARY KEY (id);

# CREATE UNIQUE INDEX idx_grit_core_vocabularies_on_name_unique ON public.grit_core_vocabularies USING btree (name);

# CREATE TRIGGER manage_stamps_grit_core_vocabularies BEFORE INSERT OR UPDATE ON public.grit_core_vocabularies FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


# ----

# CREATE TABLE public.grit_core_vocabulary_bacteria (
#     id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
#     created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
#     created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
#     updated_by character varying(30),
#     updated_at timestamp(6) without time zone,
#     name character varying NOT NULL
# );

# ALTER TABLE ONLY public.grit_core_vocabulary_bacteria
#     ADD CONSTRAINT grit_core_vocabulary_bacteria_pkey PRIMARY KEY (id);

# CREATE UNIQUE INDEX idx_grit_core_vocabulary_bacteria_on_name_unique ON public.grit_core_vocabulary_bacteria USING btree (name);

# CREATE TRIGGER manage_stamps_grit_core_vocabulary_bacteria BEFORE INSERT OR UPDATE ON public.grit_core_vocabulary_bacteria FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();

module Grit
  module Core
    module Vocabularies
      Grit::Core::Vocabulary.unscoped.each do |vocabulary|
        name = vocabulary.name

        modelKlass = Class.new(ActiveRecord::Base) do
          self.table_name = "grit_core_vocabulary_#{name.underscore.pluralize}"
          include Grit::Core::GritEntityRecord

          display_column "name"

          entity_crud_with read: [],
            create: [ "Administrator" ],
            update: [ "Administrator" ],
            destroy: [ "Administrator" ]
        end
        const_set name.classify, modelKlass

        controllerKlass = Class.new(ActionController::API) do
          include Grit::Core::GritEntityController

          private

          def permitted_params
            %i[ name ]
          end
        end
        const_set "#{name.underscore.pluralize}_controller".classify, controllerKlass

        Grit::Core::Engine.routes.append do
          namespace :vocabularies do
            resources modelKlass.name.demodulize.underscore.pluralize.to_sym
          end
        end
      end
    end
  end
end
