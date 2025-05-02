/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import styles from "./header.module.scss";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { classnames } from "@grit/client-library/utils";
import { useUpdateUserSettingsMutation } from "../../features/user-account-settings/mutations";
import { hasRoles } from "../../features/session/utils";
import { Dropdown } from "@grit/client-library/components";
import { useLogoutMutation, useSession } from "../../features/session";
import { UserSettings } from "../../features/user-account-settings";
import Logo from "../../assets/grit42-logo.svg";
import { notifyOnError } from "@grit/api";
import NewTabIcon from "@grit/client-library/icons/NewTab";

const isActivePath = (location: string, path: string) => {
  return (
    location === path ||
    (location.startsWith(path) && location.charAt(path.length) === "/")
  );
};

interface Props {
  navItems: { name: string; path: string; roles?: string[] }[];
}

const Header = ({ navItems }: Props) => {
  const { data: session } = useSession();
  const navLinkRefs = useRef<{ [key: string]: HTMLAnchorElement }>({});
  const location = useLocation();
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();
  const updateUserSettingsMutation = useUpdateUserSettingsMutation();
  const availableNavItems = useMemo(
    () =>
      session
        ? navItems.filter(({ roles }) => !roles || hasRoles(session, roles))
        : [],
    [navItems, session],
  );

  const currentLink = useMemo(() => {
    return availableNavItems.find((x) =>
      isActivePath(location.pathname, x.path),
    );
  }, [availableNavItems, location.pathname]);

  const [currentLinkRef, setCurrentLinkRef] = useState<
    HTMLAnchorElement | undefined
  >(undefined);

  const handleSettingsUpdate = async (
    setting: keyof UserSettings,
    value: string,
  ) => {
    await updateUserSettingsMutation.mutateAsync({
      ...(session?.settings ?? {}),
      [setting]: value,
    }, { onError: notifyOnError });
  };

  useLayoutEffect(() => {
    if (!currentLink) {
      return;
    }

    setCurrentLinkRef(navLinkRefs.current[currentLink.path]);
  }, [navLinkRefs, currentLink]);

  if (!session) return null;

  const nextTheme =
    !session.settings.theme || session.settings.theme === "dark"
      ? "light"
      : "dark";

  const nextDisplayDensity =
    !session.settings.display_density ||
    session.settings.display_density === "comfortable"
      ? "compact"
      : "comfortable";

  return (
    <>
      <nav className={styles.navigation}>
        <div className={styles.navContent}>
          <div className={styles.links}>
            {availableNavItems.map((item) => {
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  ref={(el) => {
                    if (!el) return;

                    navLinkRefs.current[item.path] = el;
                  }}
                  className={({ isActive }) =>
                    isActive ? styles.selected : undefined
                  }
                >
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <a href="/docs/intro" target="_blank" rel="noopener noreferrer" className={styles.documentationLink}>
              Documentation <NewTabIcon height={16} fill={"var(--palette-background-contrast-text)"} />
            </a>

            <div
              className={classnames(styles.linkSelector, {
                [styles.hide as string]: !currentLink,
              })}
              style={{
                width: currentLinkRef?.clientWidth ?? 0,
                left: `${currentLinkRef?.offsetLeft}px`,
              }}
            />
          </div>

          <div className={styles.right}>
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
                    onClick: () =>
                        handleSettingsUpdate("theme", nextTheme),
                  },
                  {
                    id: "TOGGLE_DISPLAY_DENSITY",
                    text: `Switch to ${nextDisplayDensity} mode`,
                    onClick: () =>
                        handleSettingsUpdate(
                          "display_density",
                          nextDisplayDensity,
                        ),
                  },
                  {
                    id: "LOGOUT",
                    text: "Log out",
                    onClick: () =>
                      logoutMutation.mutateAsync(),
                  },
                ]}
              >
                <h4 className={styles.username}>{session.name ?? session.login}</h4>
              </Dropdown>
            </div>
            <a href="https://grit42.com/" target="_blank">
              <img className={styles.gritLogo} src={Logo} alt="grit42 logo" />
            </a>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
