Grit::Core::Engine.routes.draw do
  resources_with_export :vocabulary_items
  resources :vocabularies do
    resources_with_export :vocabulary_items
  end
  resources :publication_statuses
  resources_with_export :units
  resources_with_export :data_types do
    collection do
      post :guess_data_type_for_columns
    end
  end
  resources :load_set_loaded_records
  resources :load_sets do
    collection do
      get :fields
    end

    get :data_set_fields
    get :mapping_fields
    get :preview_data
    get :data
    get :loaded_data_columns
    post :set_mappings
    post :set_data
    post :validate
    post :confirm
    post :rollback
    get :entity_info
  end
  resources :load_set_blocks do
    collection do
      get :fields
    end

    get :data_set_fields
    get :mapping_fields
    get :preview_data
    get :validated_data
    get :errored_data
    get :warning_data
    get :data
    get :loaded_data_columns
    get :export_errored_rows
    get :export_errors
    post :set_mappings
    post :set_data
    post :initialize_data
    post :validate
    post :confirm
    post :rollback
    get :entity_info
  end

  resources :load_set_statuses

  resources_with_export :origins do
    collection do
      delete :destroy
    end
  end

  resources_with_export :locations do
    collection do
      delete :destroy
    end
  end

  resources_with_export :countries
  resources :user_roles
  resources :users
  resources :user_statuses
  resources :roles

  resource :user, only: [] do
    post :activate
    post :request_password_reset
    post :request_password_reset_for_user
    post :password_reset
    post :update_password
    post :update_info
    post :update_settings
    post :generate_auth_token
    post :revoke_auth_token
    post :generate_api_token
    post :generate_api_token_for_user
    post :revoke_activation_token_for_user
    post :revoke_forgot_token_for_user
    get :hello_world_api
  end

  resource :user_session, only: %i[show create destroy] do
    post :two_factor
    get :server_settings, on: :collection
  end

  # OmniAuth SSO callbacks — OmniAuth middleware intercepts the initiation
  # request (POST /api/grit/core/auth/:provider) at the Rack level, then
  # redirects to these callback routes after IdP authentication.
  match "auth/:provider/callback", to: "sso_sessions#create", via: %i[get post]
  get "auth/failure", to: "sso_sessions#failure"

  resources :entities, only: [ :index, :show ] do
    get :columns
    get :fields
  end
end
