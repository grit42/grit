Grit::Compounds::Engine.routes.draw do
  resources :compound_load_sets do
    get :mapping_fields
    get :preview_data
    post :set_mappings
    post :confirm
  end

  resources_with_export :batches
  resources :batch_properties do
    # TODO: remove in bugfix/compound-long-safe-name
    collection do
      get :properties_with_too_long_safe_name
    end
  end
  resources_with_export :synonyms
  resources_with_export :compounds
  resources :compound_properties do
    # TODO: remove in bugfix/compound-long-safe-name
    collection do
      get :properties_with_too_long_safe_name
    end
  end
  resources_with_export :compound_types
  resources :molecules, only: [] do
    collection do
      post :molecule_exists
    end
  end
end
