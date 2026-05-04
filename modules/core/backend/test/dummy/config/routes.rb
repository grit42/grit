Rails.application.routes.draw do
  scope :api do
    namespace :grit do
      resources :test_entities
      resources :overridden_entities
    end
  end
end
