module Grit::Core
  class PermissionsController < ApplicationController
    include Grit::Core::Controller::Unforgeable
    include Grit::Core::Controller::Authenticated
    include Grit::Core::Controller::Readable
  end
end
