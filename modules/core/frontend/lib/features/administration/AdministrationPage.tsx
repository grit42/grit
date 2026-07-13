import { NavLink, Outlet } from "react-router-dom";
import { useBreadcrumbs } from "../../app";
import styles from "./administration.module.scss";
import { classnames } from "@grit42/client-library/utils";
import { useMemo } from "react";
import { useAdministrationContext } from "./AdministrationContext";

interface NavItem {
  label: string;
  group: string;
  url: string;
}

const AdministrationNav = () => {
  const { authorizedPages } = useAdministrationContext();
  const { groups, groupedItems } = useMemo(() => {
    const groupedItems: Record<string, NavItem[]> = {};
    for (const navItem of authorizedPages) {
      const group = groupedItems[navItem.group] ?? [];
      group.push(navItem);
      if (!groupedItems[navItem.group]) groupedItems[navItem.group] = group;
    }
    return { groups: Object.keys(groupedItems), groupedItems };
  }, [authorizedPages]);

  return (
    <nav className={styles.nav}>
      <ul className={styles.navGroups}>
        {groups.map((group) => (
          <li key={group} className={styles.navGroup}>
            <span className={styles.navGroupHeader}>{group}</span>
            <ul className={styles.navGroupItems}>
              {groupedItems[group].map((d) => (
                <li key={d.url}>
                  <NavLink
                    to={d.url}
                    className={({ isActive }) =>
                      classnames(styles.navItem, {
                        [styles.active]: isActive,
                      })
                    }
                  >
                    <div className={styles.indicator} />
                    <span className={styles.navItemLabel}>{d.label}</span>
                  </NavLink>
                </li>
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
