import { Navigate, Route, Routes } from "react-router-dom";
import { Suspense } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import styles from "./app.module.scss";
import { classnames } from "@grit/client-library/utils";

import { Meta as CoreMeta, Router as CoreRouter, useSession } from "@grit/core";

import {
  Meta as CompoundsMeta,
  Router as CompoundsRouter,
} from "@grit/compounds";

import {
  Meta as AssaysMeta,
  Router as AssaysRouter,
} from "@grit/assays";

import Header from "@grit/core/Header";
import defaultRoute from "./defaultRoute";
import { Spinner, ThemeProvider } from "@grit/client-library/components";
import { Toolbar } from "@grit/core/Toolbar";

const AppRouter = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path={`/${CoreMeta.rootRoute}/*`} element={<CoreRouter />} />
        <Route
          path={`/${CompoundsMeta.rootRoute}/*`}
          element={<CompoundsRouter />}
        />
        <Route
          path={`/${AssaysMeta.rootRoute}/*`}
          element={<AssaysRouter />}
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

const NAV_ITEMS = [...CompoundsMeta.navItems, ...AssaysMeta.navItems, ...CoreMeta.navItems];

const App = () => {
  const { data: session, isLoading } = useSession();

  if (isLoading && !session) {
    <ThemeProvider colorScheme={"dark"} displayDensity={"comfortable"}>
      <div className={styles.appContainer}>
        <Spinner />
      </div>
    </ThemeProvider>;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{"grit"}</title>
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
