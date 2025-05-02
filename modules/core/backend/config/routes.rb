Grit::Core::Engine.routes.draw do
  resources :publication_statuses
  resources_with_export :units
  resources_with_export :data_types
  resources :load_set_loaded_records
  resources :load_sets do
    collection do
      get :fields
    end

    get :mapping_fields
    get :preview_data
    post :set_mappings
    post :validate
    post :confirm
    post :rollback
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
    post :password_reset
    post :update_password
    post :update_info
    post :update_settings
    post :generate_auth_token
    post :revoke_auth_token
  end

  resource :user_session, only: %i[show create destroy] do
    post :two_factor
  end

  resources :entities, only: [ :index, :show ] do
    get :columns
    get :fields
  end
end
