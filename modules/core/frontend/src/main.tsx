import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CoreModule, { App } from "@grit42/core";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App modules={[CoreModule]} />
  </StrictMode>,
);
