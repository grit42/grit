Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.

  get "app/", to: ->(env) do
    [ 200, { "Content-Type" => "text/html" }, [ Rails.public_path.join("index.html").read ] ]
  end
  get "app/*all", to: ->(env) do
    [ 200, { "Content-Type" => "text/html" }, [ Rails.public_path.join("index.html").read ] ]
  end

  mount ActionDispatch::Static.new(
    Rails.application,
    Rails.root.join("public/docs").to_s
  ), at: "/docs"

  root to: ->(env) do
    [ 200, { "Content-Type" => "text/html" }, [ Rails.public_path.join("index.html").read ] ]
  end
end
