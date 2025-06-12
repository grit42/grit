#!/usr/bin/env ruby
require 'bundler'

# Usage: ruby print_gem_dependencies.rb path/to/your.gemspec

gemfile_path = ARGV[0]

unless gemfile_path && File.exist?(gemfile_path)
  puts "Usage: ruby gemfile_deps.rb path/to/Gemfile"
  exit 1
end

# Load the Gemfile
definition = Bundler::Definition.build(gemfile_path, nil, nil)

if definition.nil?
  puts "Could not load Gemfile at #{gemfile_path}"
  exit 1
end

# Get all dependencies from the Gemfile
dependencies = definition.dependencies

# Print the name of each dependency
dependency_names = dependencies.map(&:name).uniq

# Output as JSON array of strings
puts dependency_names.join(',')
