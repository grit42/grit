import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { queryClient, QueryClientProvider } from "@grit/api";
import App from "./App.tsx";
import defaultRoute from "./defaultRoute.ts";
import "./index.scss";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Provider from "./app/Provider.tsx";
import Registrant from "./app/Registrant.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <Provider>
        <Registrant />
        <BrowserRouter basename={import.meta.env.DEV ? undefined : "/app"}>
          <App />
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  </StrictMode>,
);

if (!import.meta.env.DEV && window.location.pathname === "/") {
  window.location.replace(`/app${defaultRoute}`);
}
