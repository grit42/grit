Rails.application.routes.draw do
  scope :api do
    namespace :grit do
      resources :test_entities
    end
  end
end
