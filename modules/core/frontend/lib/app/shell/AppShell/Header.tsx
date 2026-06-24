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

import styles from "./header.module.scss";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button, Dropdown } from "@grit42/client-library/components";
import {
  useSession,
  useUpdateUserSettingsMutation,
} from "../../../features/auth";
import { useLogoutMutation } from "../../../features/auth/api/mutations";
import type { UserSettings } from "../../../features/auth";
import Logo from "../../../assets/grit42-logo.svg";
import { notifyOnError } from "@grit42/api";
import { useAppShell } from "./AppShellContext";
import { classnames } from "@grit42/client-library/utils";
import { Fragment } from "react/jsx-runtime";

const Header = () => {
  const { breadcrumbs, tabs } = useAppShell();
  const { data: session } = useSession();
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();
  const updateUserSettingsMutation = useUpdateUserSettingsMutation();

  const handleSettingsUpdate = async (
    setting: keyof UserSettings,
    value: string,
  ) => {
    await updateUserSettingsMutation.mutateAsync(
      {
        ...(session?.settings ?? {}),
        [setting]: value,
      },
      { onError: notifyOnError },
    );
  };

  const nextTheme =
    !session?.settings.theme || session.settings.theme === "dark"
      ? "light"
      : "dark";

  const nextDisplayDensity =
    !session?.settings.display_density ||
    session.settings.display_density === "comfortable"
      ? "compact"
      : "comfortable";

  return (
    <div className={styles.header}>
      <div className={styles.topbar}>
        <Link to="/">
          <img className={styles.gritLogo} src={Logo} alt="grit42 logo" />
        </Link>

        <div className={styles.breadcrumbs}>
          {!!breadcrumbs.items?.length &&
            breadcrumbs.items.map((item, index) => (
              <Fragment key={`${item.label}-${item.url}`}>
                {index !== 0 && <span className={styles.separator}>/</span>}
                <Link className={styles.breadcrumb} to={item.url}>
                  {item.label}
                </Link>
              </Fragment>
            ))}
        </div>
        <div className={styles.profile}>
          <Dropdown
            menuItems={[
              {
                id: "ACCOUNT_SETTINGS",
                text: "Account settings",
                onClick: () => navigate("/core/account"),
              },
              {
                id: "TOGGLE_THEME",
                text: `Switch to ${nextTheme} mode`,
                onClick: () => handleSettingsUpdate("theme", nextTheme),
              },
              {
                id: "TOGGLE_DISPLAY_DENSITY",
                text: `Switch to ${nextDisplayDensity} mode`,
                onClick: () =>
                  handleSettingsUpdate("display_density", nextDisplayDensity),
              },
              {
                id: "LOGOUT",
                text: "Log out",
                onClick: () => logoutMutation.mutateAsync(),
              },
            ]}
          >
            <h4 className={styles.username}>
              {session?.name ?? session?.login ?? "Guest user"}
            </h4>
          </Dropdown>
        </div>
      </div>
      {!!tabs.items?.length && (
        <div className={styles.tabs}>
          {tabs.items.map(({ label, url }) => (
            <NavLink key={`${label}-${url}`} to={url}>
              {({ isActive }) => (
                <Button
                  className={classnames(styles.tab, {
                    [styles.active]: isActive,
                  })}
                  size="tiny"
                >
                  {label}
                  {isActive && <span />}
                </Button>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;
