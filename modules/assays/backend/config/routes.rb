Grit::Assays::Engine.routes.draw do
  resources :experiment_data_sheet_values
  resources :experiment_data_sheet_records
  resources :experiment_data_sheets

  resources :experiments do
    get :export
  end

  resources :assay_data_sheet_columns
  resources :assay_data_sheet_definitions
  resources :assay_metadata_definitions
  resources :assay_metadata
  resources :assays
  resources :assay_model_metadata
  resources :assay_models do
    post :update_metadata
  end
  resources :assay_types
  resources :vocabulary_items
  resources :vocabularies
end
