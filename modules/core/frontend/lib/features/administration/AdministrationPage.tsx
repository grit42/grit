import { NavLink, Outlet } from "react-router-dom";
import { useBreadcrumbs } from "../../app";
import styles from "./administration.module.scss";
import { classnames } from "@grit42/client-library/utils";
import { useMemo } from "react";

interface NavItem {
  label: string;
  group: string;
  url: string;
}

const NAV_ITEMS = [
  {
    label: "Users",
    group: "Access",
    url: "/core/administration/users",
  },
  {
    label: "Roles and permissions",
    group: "Access",
    url: "/core/administration/roles",
  },
];

const AdministrationNav = () => {
  const navItems = NAV_ITEMS;

  const { groups, groupedItems } = useMemo(() => {
    const groupedItems: Record<string, NavItem[]> = {};
    for (const navItem of navItems) {
      const group = groupedItems[navItem.group] ?? [];
      group.push(navItem);
      if (!groupedItems[navItem.group]) groupedItems[navItem.group] = group;
    }
    return { groups: Object.keys(groupedItems), groupedItems };
  }, [navItems]);

  return (
    <nav className={styles.nav}>
      <ul className={styles.navGroups}>
        {groups.map((group) => (
          <li className={styles.navGroup}>
            <span className={styles.navGroupHeader}>{group}</span>
            <ul className={styles.navGroupItems}>
              {groupedItems[group].map((d) => (
                <NavLink key={d.url} to={d.url}>
                  {({ isActive }) => (
                    <li
                      className={classnames(styles.navItem, {
                        [styles.active]: isActive,
                      })}
                    >
                      <div className={styles.indicator} />
                      <span className={styles.navItemLabel}>{d.label}</span>
                    </li>
                  )}
                </NavLink>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const BREADCRUMBS = [{ label: "Administration", url: "/core/administration" }];

const AdministrationPage = () => {
  useBreadcrumbs(BREADCRUMBS);

  return (
    <div className={styles.administration}>
      <AdministrationNav />
      <Outlet />
    </div>
  );
};

export default AdministrationPage;
