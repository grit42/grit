import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import styles from "./app.module.scss";
import { classnames } from "@grit/client-library/utils";

const LazyCoreRouter = lazy(() =>
  import("@grit/core").then((module) => ({ default: module.Router })),
);
import { Meta as CoreMeta, useSession } from "@grit/core";

import Header from "@grit/core/Header";
import defaultRoute from "./defaultRoute";
import { Spinner, ThemeProvider } from "@grit/client-library/components";
import { Toolbar } from "@grit/core/Toolbar";

const AppRouter = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path={`/${CoreMeta.rootRoute}/*`} element={<LazyCoreRouter />} />
        <Route
          index
          path="*"
          element={<Navigate to={defaultRoute} replace />}
        />
      </Routes>
    </Suspense>
  );
};

const NAV_ITEMS = [...CoreMeta.navItems];

const App = () => {
  const { data: session, isLoading } = useSession();

  if (isLoading && !session) return <Spinner />;

  return (
    <HelmetProvider>
      <Helmet>
        <title>{"grit core"}</title>
      </Helmet>
      <ThemeProvider
        colorScheme={session?.settings.theme ?? "dark"}
        displayDensity={session?.settings.display_density ?? "comfortable"}
      >
        <div
          className={classnames(styles.appContainer, {
            [styles.withHeader]: !!session,
          })}
        >
          <Header navItems={NAV_ITEMS} />
          {session && <Toolbar />}
          <div
            className={classnames(styles.appBodyContainer, {
              [styles.withPadding]: !!session,
            })}
          >
            <AppRouter />
          </div>
        </div>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
