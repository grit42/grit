import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CoreModule, { App } from "@grit42/core";
import CompoundsModule from "@grit42/compounds";

const modules = [CoreModule, CompoundsModule];
const navItems = [
  ...CompoundsModule.Meta.navItems,
  ...CoreModule.Meta.navItems,
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App modules={modules} navItems={navItems} />
  </StrictMode>,
);
