Grit::Assays::Engine.routes.draw do
  resources :experiment_metadata_templates
  resources :experiment_metadata
  resources :data_table_columns
  resources :data_table_entities do
    collection do
      post :create_bulk
    end
  end

  resources :data_table_rows, only: [] do
    get :full_perspective
  end

  resources :data_tables do
    resources_with_export :data_table_rows
    resources :data_table_entities
    resources :data_table_columns
  end

  resources :experiments do
    resources :experiment_attachments, only: [:index, :create, :destroy] do
      collection do
        get :export
      end
    end

    get :export
    post :publish
    post :draft
  end

  resources :assay_data_sheet_columns
  resources :assay_data_sheet_definitions do
    collection do
      post :create_bulk
    end
    resources :experiment_data_sheet_records
  end
  resources :assay_metadata_definitions
  resources :assay_model_metadata
  resources :assay_models do
    post :update_metadata
    post :publish
    post :draft
  end
  resources :assay_types
end
