require_relative "lib/grit/core/version"

Gem::Specification.new do |spec|
  spec.name        = "grit-core"
  spec.version     = Grit::Core::VERSION
  spec.authors     = [ "Jonathan Rebourt" ]
  spec.email       = [ "jonny@grit42.com" ]
  spec.summary     = "Summary of Grit::Core."
  spec.description = "Description of Grit::Core."
  spec.licenses    = [ "GPL-3.0-or-later" ]

  spec.metadata["allowed_push_host"] = ""

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "Rakefile", "README.md", "COPYING"]
  end

  spec.add_dependency "rails", ">= 7.2.2"

  # Cryptography
  spec.add_dependency "scrypt"

  # Authentication and session management
  spec.add_dependency "authlogic"
end
