/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/app.
 *
 * @grit42/app is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/app is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/app. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  LazyExoticComponent,
  PropsWithChildren,
  ReactNode,
  StrictMode,
  useMemo,
} from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { queryClient, QueryClientProvider } from "@grit42/api";
import "./index.scss";
import Provider from "./app/Provider.tsx";
import Registrant from "./app/Registrant.tsx";

import { Navigate, Route, Routes } from "react-router-dom";
import { Suspense } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import styles from "./app.module.scss";
import { classnames } from "@grit42/client-library/utils";

import Header from "@grit42/core/Header";
import { Spinner, ThemeProvider } from "@grit42/client-library/components";
import { Toolbar } from "@grit42/core/Toolbar";
import { GritModule, ModuleNavItem, useSession } from "@grit42/core";

const AppRouter = ({
  routers,
  redirectPath,
}: {
  routers: { path: string; Router: LazyExoticComponent<() => JSX.Element> }[];
  redirectPath: string;
}) => {
  const routes = useMemo(
    () => [
      ...routers.map((r) => (
        <Route path={`/${r.path}/*`} element={<r.Router />} />
      )),
    ],
    [],
  );

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {...routes}
        <Route index path="*" element={<Navigate to={redirectPath} replace />} />
      </Routes>
    </Suspense>
  );
};

const App = ({
  routers,
  navItems,
}: {
  routers: { path: string; Router: LazyExoticComponent<() => JSX.Element> }[];
  navItems: ModuleNavItem[];
}) => {
  const { data: session, isLoading } = useSession();

  if (isLoading && !session) {
    <ThemeProvider colorScheme={"dark"} displayDensity={"comfortable"}>
      <div
        className={styles.appContainer}
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner />
      </div>
    </ThemeProvider>;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{GritApplication.getTitle()}</title>
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
          <Header navItems={navItems} />
          {session && <Toolbar />}
          <div
            className={classnames(styles.appBodyContainer, {
              [styles.withPadding]: !!session,
            })}
          >
            <AppRouter routers={routers} redirectPath={GritApplication.getDefaultRoute()} />
          </div>
        </div>
      </ThemeProvider>
    </HelmetProvider>
  );
};

const AppWrapper = ({
  children,
  providers,
  registrants,
}: PropsWithChildren<{
  providers: React.FunctionComponent[];
  registrants: React.FunctionComponent[];
}>) => {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Provider providers={providers}>
          <Registrant registrants={registrants} />
          <BrowserRouter basename="/app">
            {children}
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    </StrictMode>
  );
};

class GritApplication {
  private static appWrapper: null | ReactNode = null;
  private static navItems: ModuleNavItem[] = [];
  private static registrants: React.FunctionComponent[] = [];
  private static providers: React.FunctionComponent[] = [];
  private static routers: {
    path: string;
    Router: LazyExoticComponent<() => JSX.Element>;
  }[] = [];
  private static title: string = "grit"
  private static defaultRoute: string | undefined = undefined;

  private static createAppWrapper() {
    GritApplication.appWrapper = (
      <AppWrapper
        registrants={GritApplication.registrants}
        providers={GritApplication.providers}
      >
        <App routers={GritApplication.routers} navItems={GritApplication.navItems} />
      </AppWrapper>
    );
  }

  private static createReactApp() {
    createRoot(document.getElementById("root")!).render(
      GritApplication.appWrapper,
    );
  }

  public static registerModule(module: GritModule) {
    GritApplication.routers.push({
      Router: module.Router,
      path: module.Meta.rootRoute,
    });
    GritApplication.navItems.push(...module.Meta.navItems);
    if (module.Registrant) GritApplication.registrants.push(module.Registrant);
    if (module.Provider) GritApplication.providers.push(module.Provider);
  }

  public static setTitle(title: string) {
    GritApplication.title = title;
  }

  public static getTitle() {
    return this.title;
  }

  public static setDefaultRoute(defaultRoute: string) {
    this.defaultRoute = defaultRoute;
  }

  public static getDefaultRoute() {
    return this.defaultRoute ?? this.navItems[0]?.path;
  }

  public static mount() {
    this.createAppWrapper();
    this.createReactApp();
  }
}

export default GritApplication;
