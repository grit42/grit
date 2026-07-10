import { lazy } from "react";
import { Route } from "react-router-dom";
import { AuthGuard } from "../auth";
const LazyAdministrationRouter = lazy(() => import("./AdministrationRouter"));

const AdministrationRoutes = (
  <Route
    path="administration/*"
    element={
      <AuthGuard>
        <LazyAdministrationRouter />
      </AuthGuard>
    }
  />
);

export default AdministrationRoutes;
