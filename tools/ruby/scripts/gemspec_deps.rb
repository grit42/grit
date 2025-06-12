#!/usr/bin/env ruby
require 'rubygems'
require 'json'

# Usage: ruby gemspec_deps.rb path/to/your.gemspec

gemspec_path = ARGV[0]

unless gemspec_path && File.exist?(gemspec_path)
  puts "Usage: ruby gemspec_deps.rb path/to/your.gemspec"
  exit 1
end

spec = Gem::Specification.load(gemspec_path)

if spec.nil?
  puts "Could not load gemspec at #{gemspec_path}"
  exit 1
end

# Select only runtime dependencies
runtime_dependencies = spec.dependencies.select { |dep| dep.type == :runtime }
dependency_names = runtime_dependencies.map(&:name).uniq

# Output as JSON array of strings
puts dependency_names.join(',')
