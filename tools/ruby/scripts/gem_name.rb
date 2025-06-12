#!/usr/bin/env ruby

# Usage: ruby print_gem_name.rb path/to/your.gemspec

gemspec_path = ARGV[0]

unless gemspec_path && File.exist?(gemspec_path)
  puts "Usage: ruby print_gem_name.rb path/to/your.gemspec"
  exit 1
end

spec = Gem::Specification.load(gemspec_path)

if spec && spec.name
  puts spec.name
else
  puts "Could not determine gem name from: #{gemspec_path}"
  exit 1
end
