import { Spinner } from "@grit42/client-library/components";
import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useModules, useNavItems } from "./modules";
import { AppShell } from "./components";

const Router = () => {
  const modules = useModules();
  const navItems = useNavItems();

  return (
    <BrowserRouter basename="/app">
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<AppShell navItems={navItems} />}>
            {modules.map((module) =>
              module.Router ? (
                <Route path={module.Meta.rootRoute}>
                  <Route index path="*" element={<module.Router />} />
                </Route>
              ) : null,
            )}
            <Route
              index
              path="*"
              element={<Navigate to={navItems[0].path} replace />}
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Router;
