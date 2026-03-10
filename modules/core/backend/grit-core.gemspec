require_relative "lib/grit/core/version"

Gem::Specification.new do |spec|
  spec.name        = "grit-core"
  spec.version     = Grit::Core::VERSION
  spec.authors     = [ "Jonathan Rebourt" ]
  spec.email       = [ "jonny@grit42.com" ]
  spec.summary     = "Core module for the grit platform"
  spec.description = "This module provides basic functionalities of the grit platform, such as user, session, and generic entity management."
  spec.licenses    = [ "GPL-3.0-or-later" ]
  spec.homepage    = "https://grit42.github.io/grit"

  spec.metadata["allowed_push_host"] = "https://rubygems.pkg.github.com/grit42"
  spec.metadata["github_repo"] = "ssh://github.com/grit42/grit"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "Rakefile", "README.md", "COPYING"]
  end

  spec.add_dependency "rails", '~> 8.1'

  # Ruby 3.4 bundled gems (no longer default)
  spec.add_dependency "csv"
  spec.add_dependency "ostruct"

  # Cryptography
  spec.add_dependency "scrypt", '~> 3.1'

  # Authentication and session management
  spec.add_dependency "authlogic", '~> 6.6'

  # Testing
  spec.add_development_dependency "rspec-rails", "~> 8.0"
  spec.add_development_dependency "rswag-specs", "~> 2.17"
  spec.add_development_dependency "factory_bot_rails", "~> 6.5"
end
