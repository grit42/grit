import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import styles from "./app.module.scss";
import { classnames } from "@grit/client-library/utils";

const LazyCoreRouter = lazy(() =>
  import("@grit/core").then((module) => ({ default: module.Router })),
);
import { Meta as CoreMeta, useSession } from "@grit/core";

const LazyCompoundsRouter = lazy(() =>
  import("@grit/compounds").then((module) => ({ default: module.Router })),
);
import { Meta as CompoundsMeta } from "@grit/compounds";

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
          path={`/${CompoundsMeta.rootRoute}/*`}
          element={<LazyCompoundsRouter />}
        />
        <Route
          index
          path="*"
          element={<Navigate to={defaultRoute} replace />}
        />
      </Routes>
    </Suspense>
  );
};

const NAV_ITEMS = [...CompoundsMeta.navItems, ...CoreMeta.navItems.filter(({name}) => name !== "Entities")];

const App = () => {
  const { data: session, isLoading } = useSession();

  if (isLoading && !session) {
    <ThemeProvider colorScheme={"dark"} displayDensity={"comfortable"}>
      <div className={styles.appContainer} style={{height: "100vh", display: "flex", alignItems: "center", justifyContent: "center"}}>
        <Spinner />
      </div>
    </ThemeProvider>;
  }


  return (
    <HelmetProvider>
      <Helmet>
        <title>{"grit compounds"}</title>
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
