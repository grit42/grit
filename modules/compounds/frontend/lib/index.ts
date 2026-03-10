import { lazy } from "react";
import Registrant from "./Registrant";
import Provider from "./Provider";
import Meta from "./meta";
import { GritModule } from "@grit42/core";
const Router = lazy(() => import("./Router"));

const CompoundsModule: GritModule = {
  Meta,
  Router,
  Registrant,
  Provider,
};

export default CompoundsModule;
