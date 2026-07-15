import { NavLink } from "react-router-dom";
import { NavItem } from "../../navigation";
import { hasRoles, useSession } from "../../../features/auth";
import { useMemo } from "react";
import CloseIcon from "@grit42/client-library/icons/Cross";
import { useAppShell } from "./AppShellContext";
import { Button } from "@grit42/client-library/components";
import { useMountTransition, useTheme } from "@grit42/client-library/hooks";
import styles from "./navbar.module.scss";
import { classnames } from "@grit42/client-library/utils";
import Logo42 from "../../../assets/42-logo.svg";
import LogoGrit42 from "../../../assets/resized-grit42-logo.svg";

const stopEventPropagation = (e: React.MouseEvent) => e.stopPropagation();

const Sidebar = ({ navItems }: { navItems: NavItem[] }) => {
  const { open, toggleNavbar } = useAppShell().navbar;
  const { transitionState, showTransition } = useMountTransition(open, 250);
  const { data: session } = useSession();
  const availableNavItems = useMemo(
    () =>
      session
        ? navItems.filter(({ roles }) => !roles || hasRoles(session, roles))
        : [],
    [navItems, session],
  );

  const { colorScheme } = useTheme();

  const isMounted = open || showTransition || transitionState === "out";

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={classnames(styles.menuContainer, {
        [styles.show]: showTransition,
      })}
      onClick={toggleNavbar}
    >
      <div
        className={classnames(styles.navbar, {
          [styles.open]: isMounted,
          [styles.show]: showTransition,
        })}
        onClick={stopEventPropagation}
      >
        <div className={styles.header}>
          <img
            className={classnames(styles.gritLogo, {
              [styles.light]: colorScheme === "light",
            })}
            src={isMounted ? LogoGrit42 : Logo42}
            alt="grit42 logo"
          />
          <Button
            onClick={toggleNavbar}
            size="tiny"
            className={classnames(styles.closeButton)}
          >
            <CloseIcon />
          </Button>
        </div>
        <div className={styles.divider} />
        <nav className={styles.nav}>
          {availableNavItems.map((navItem) => (
            <NavLink
              key={navItem.identifier}
              to={navItem.path}
              onClick={toggleNavbar}
            >
              {({ isActive }) => (
                <Button
                  size="tiny"
                  className={classnames(styles.sidebarButton, styles.navLink, {
                    [styles.active]: isActive,
                    [styles.open]: isMounted,
                  })}
                >
                  {isMounted && navItem.name}
                </Button>
              )}
            </NavLink>
          ))}
        </nav>
        <div className={styles.divider} />
      </div>
    </div>
  );
};

export default Sidebar;
