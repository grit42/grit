import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CoreModule, { App } from "@grit42/core";
import AssaysModule from "@grit42/assays";

const modules = [CoreModule, AssaysModule];
const navItems = [...AssaysModule.Meta.navItems, ...CoreModule.Meta.navItems];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App modules={modules} navItems={navItems} />
  </StrictMode>,
);
