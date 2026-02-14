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

import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { queryClient, QueryClientProvider } from "@grit42/api";
import "./index.scss";
import Provider from "./Provider.tsx";
import Registrant from "./Registrant.tsx";

import { Helmet, HelmetProvider } from "react-helmet-async";
import styles from "./app.module.scss";
import { classnames } from "@grit42/client-library/utils";

import Header from "@grit42/core/Header";
import { Spinner, ThemeProvider } from "@grit42/client-library/components";
import { Toolbar } from "@grit42/core/Toolbar";
import CoreMeta from "@grit42/core/meta";
import CompoundsMeta from "@grit42/compounds/meta";
import Router from "./Router.tsx";
import { useSession } from "@grit42/core";

const NAV_ITEMS = [...CompoundsMeta.navItems, ...CoreMeta.navItems];

const App = () => {
  const { data: session, isLoading } = useSession();

  if (isLoading && !session) {
    return (
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
      </ThemeProvider>
    );
  }

  return (
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
          <Router />
        </div>
      </div>
    </ThemeProvider>
  );
};

const AppWrapper = () => {
  return (
    <StrictMode>
      <HelmetProvider>
        <Helmet>
          <title>grit</title>
        </Helmet>
        <QueryClientProvider client={queryClient}>
          <Provider>
            <Registrant />
            <BrowserRouter basename="/app">
              <App />
            </BrowserRouter>
          </Provider>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>
  );
};

export default AppWrapper;
