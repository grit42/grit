/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { Spinner } from "@grit42/client-library/components";
import { useSession } from "../../../features/auth";
import styles from "./appShell.module.scss";
import { classnames } from "@grit42/client-library/utils";
import Header from "../Header";
import { Outlet } from "react-router-dom";
import { Toolbar } from "../../../features/toolbar";
import { NavItem } from "../../navigation";

interface AppShellProps {
  navItems: NavItem[];
}

const AppShell = ({ navItems }: React.PropsWithChildren<AppShellProps>) => {
  const { data: session, isLoading } = useSession();

  if (isLoading && !session) {
    return (
      <main
        id="app-shell"
        className={classnames(styles.appContainer, styles.loading)}
      >
        <Spinner />
      </main>
    );
  }

  return (
    <div
      className={classnames(styles.appContainer, {
        [styles.withHeader]: !!session,
      })}
    >
      <Header navItems={navItems} />
      {session && <Toolbar />}
      <main
        id="app-shell"
        className={classnames(styles.appBodyContainer, {
          [styles.withPadding]: !!session,
        })}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
