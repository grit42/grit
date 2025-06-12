require_relative "lib/grit/assays/version"
require_relative "../../core/backend/lib/grit/core/version"

Gem::Specification.new do |spec|
  spec.name        = "grit-assays"
  spec.version     = Grit::Assays::VERSION
  spec.authors     = [ "Jonathan Rebourt" ]
  spec.email       = [ "jonny@grit42.com" ]
  spec.summary     = "Assays module for the grit scientific platform"
  spec.description = "This module provides experimental data functionalities"
  spec.licenses    = [ "GPL-3.0-or-later" ]

  spec.metadata["allowed_push_host"] = "https://rubygems.pkg.github.com/grit42"
  spec.metadata["github_repo"] = "ssh://github.com/grit42/grit"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "Rakefile", "README.md", "COPYING"]
  end

  spec.add_dependency "rails", '~> 7.2', '>= 7.2.2'
  spec.add_dependency "rubyzip", "~> 2.3", ">= 2.3.2"
  spec.add_dependency "grit-core", "~> #{Grit::Core::VERSION}"
end
