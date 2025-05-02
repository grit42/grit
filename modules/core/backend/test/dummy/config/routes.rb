Rails.application.routes.draw do
  scope :api do
    resources :test_entities
  end
end
