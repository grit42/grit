import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CoreModule, { App } from "@grit42/core";
import CompoundsModule from "@grit42/compounds";
import AssaysModule from "@grit42/assays";

const modules = [CoreModule, CompoundsModule, AssaysModule];
const navItems = [
  ...CompoundsModule.Meta.navItems,
  ...AssaysModule.Meta.navItems,
  ...CoreModule.Meta.navItems,
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App modules={modules} navItems={navItems} />
  </StrictMode>,
);

if (!import.meta.env.DEV && window.location.pathname === "/") {
  window.location.replace("/app");
}
