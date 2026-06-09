import { GritModule } from "../app/modules";
import Registrant from "./Registrant";
import Provider from "./Provider";
import Meta from "./meta";
import { lazy } from "react";
const Router = lazy(() => import("./Router"));

const CoreModule: GritModule = {
  Meta,
  Router,
  Registrant,
  Provider,
};

export default CoreModule;
