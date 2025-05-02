#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-compounds.
#
# grit-compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-compounds. If not, see <https://www.gnu.org/licenses/>.
#++

module Grit
  module Compounds
    class Engine < ::Rails::Engine
      isolate_namespace Grit::Compounds
      config.generators.api_only = true

      def self.seeds
        { auto_seed: true, prerequisites: [ Grit::Core::Engine ] }
      end

      initializer :append_migrations do |app|
        unless app.root.to_s.match root.to_s
          config.paths["db/migrate"].expanded.each do |expanded_path|
            app.config.paths["db/migrate"] << expanded_path
            ActiveRecord::Migrator.migrations_paths << expanded_path
          end
        end
      end

      initializer :mount_engine do |app|
        app.routes.append do
          mount Grit::Compounds::Engine => "/api/#{Grit::Compounds::Engine.name.underscore.gsub(/\/engine/, "")}"
          # mount Grit::Compounds::Engine => "/api/#{self.name.underscore.gsub(/\/engine/, "")}"
        end
      end
    end
  end
end
