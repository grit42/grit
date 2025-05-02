require_relative "lib/grit/compounds/version"

Gem::Specification.new do |spec|
  spec.name        = "grit-compounds"
  spec.version     = Grit::Compounds::VERSION
  spec.authors     = [ "Jonathan Rebourt" ]
  spec.email       = [ "jonny@grit42.com" ]
  spec.summary     = "Compound registation module for the grit scientific platform"
  spec.description = "Compound registation module for the grit scientific platform"
  spec.licenses    = [ "GPL-3.0-or-later" ]

  spec.metadata["allowed_push_host"] = ""

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "Rakefile", "README.md", "COPYING"]
  end


  spec.add_dependency "rails", ">= 7.2.2.1"
  spec.add_dependency "grit-core", "0.1.0"
end
