#!/usr/bin/env ruby
require 'bundler'
require 'json'

# Usage: ruby print_gem_dependencies.rb path/to/your/Gemfile

gemfile_path = ARGV[0]

unless gemfile_path && File.exist?(gemfile_path)
  puts "Usage: ruby gemfile_deps.rb path/to/Gemfile"
  exit 1
end

gemfile_path = File.expand_path(gemfile_path)
gemfile_dir  = File.dirname(gemfile_path)

definition = nil

# Change into the Gemfile's directory so Bundler.root works
Dir.chdir(gemfile_dir) do
  definition = Bundler::Definition.build(gemfile_path, nil, {})
end

dependencies = definition.dependencies
dependency_names = dependencies.map(&:name).uniq

puts JSON.pretty_generate(dependency_names)
