Grit::Assays::Engine.routes.draw do
  resources :experiment_data_model_migration_checks
  resources :experiment_data_model_migration_errors
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
  resources :experiment_data_sheet_values
  resources :experiment_data_sheet_records
  resources :experiment_data_sheets

  resources :experiments do
    get :export
  end

  resources :assay_data_sheet_columns
  resources :assay_data_sheet_definitions do
    collection do
      post :create_bulk
    end
  end
  resources :assay_metadata_definitions
  resources :assay_metadata
  resources :assays
  resources :assay_model_metadata
  resources :assay_models do
    post :update_metadata
  end
  resources :assay_types

  post :check_migration, to: "experiment_data_model_migration#check_migration"
end
