#!/usr/bin/env ruby
require 'rubygems'
require 'rubygems/package'
require 'fileutils'
require 'optparse'
require 'yaml'
require 'net/http'
require 'json'
require 'uri'

# Parse command-line options
options = { dry_run: false, github_owner: "grit42", github_owner_type: "org" }
OptionParser.new do |opts|
  opts.banner = "Usage: build_and_push_gem.rb [options]"

  opts.on("-g", "--gemspec PATH", "Path to the .gemspec file")     { |v| options[:gemspec] = v }
  opts.on("-r", "--repo-url URL", "Remote repository URL")         { |v| options[:repo_url] = v }
  opts.on("-k", "--api-key-key KEY", "Key in ~/.gem/credentials")  { |v| options[:api_key_key] = v }
  opts.on("--github-owner NAME", "GitHub username or org name")    { |v| options[:github_owner] = v }
  opts.on("--github-owner-type TYPE", "user or org")               { |v| options[:github_owner_type] = v }
  opts.on("--dry-run", "Do everything except push the gem")        { options[:dry_run] = true }
end.parse!

# Validate required options
%w[gemspec repo_url api_key_key github_owner github_owner_type].each do |key|
  unless options[key.to_sym]
    puts "Missing required option: --#{key.gsub('_', '-')}"
    exit 1
  end
end

gemspec_path = File.expand_path(options[:gemspec])
repo_url     = options[:repo_url]
api_key_key  = options[:api_key_key]
github_owner = options[:github_owner]
owner_type   = options[:github_owner_type]
dry_run      = options[:dry_run]

unless File.exist?(gemspec_path)
  puts "Gemspec file not found at: #{gemspec_path}"
  exit 1
end

# Load the gemspec
spec = Gem::Specification.load(gemspec_path)
unless spec
  puts "Failed to load gemspec"
  exit 1
end

gem_name = spec.name
gem_version = spec.version.to_s

# Load credentials
credentials_path = File.join(Dir.home, '.gem', 'credentials')
unless File.exist?(credentials_path)
  puts "Credentials file not found at: #{credentials_path}"
  exit 1
end

credentials = YAML.load_file(credentials_path)
unless credentials[api_key_key.to_sym]
  puts "API key '#{api_key_key}' not found in credentials."
  exit 1
end

github_token = credentials[api_key_key.to_sym]

# GitHub version check
def gem_version_published_on_github?(owner:, owner_type:, gem_name:, version:, github_token:)
  endpoint = "https://api.github.com/#{owner_type}s/#{owner}/packages/rubygems/#{gem_name}/versions"
  uri = URI(endpoint)

  req = Net::HTTP::Get.new(uri)
  req['Authorization'] = github_token
  req['Accept'] = 'application/vnd.github+json'

  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
    http.request(req)
  end

  if response.code.to_i == 200
    versions = JSON.parse(response.body)
    versions.any? { |v| v["name"] == version }
  else
    warn "Warning: GitHub API returned #{response.code}: #{response.body}"
    false
  end
end

if gem_version_published_on_github?(
  owner: github_owner,
  owner_type: owner_type,
  gem_name: gem_name,
  version: gem_version,
  github_token: github_token
)
  puts "Gem #{gem_name} version #{gem_version} is already published on GitHub Packages."
  puts "Skipping push."
  exit 0
end

# Build the gem
puts "Building gem..."
built_gem_path = Gem::Package.build(spec)

if dry_run
  puts "[Dry Run] Skipping gem push."
  puts "[Dry Run] Would have pushed #{built_gem_path} to #{repo_url} using key '#{api_key_key}'"
else
  ENV['GEM_HOST_API_KEY'] = github_token
  puts "Pushing gem to #{repo_url} using stored key '#{api_key_key}'..."
  push_success = system("gem push #{built_gem_path} --host #{repo_url}")

  unless push_success
    puts "Push failed. Built gem left at: #{built_gem_path}"
    exit 1
  end
end

# Clean up
puts "Cleaning up built gem..."
File.delete(built_gem_path) if File.exist?(built_gem_path)
puts "Done."
