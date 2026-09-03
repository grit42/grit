import { Link, NavLink } from "react-router-dom";
import { NavItem } from "../../navigation";
import { hasRoles, useSession } from "../../../features/auth";
import { useMemo } from "react";
import OpenIcon from "@grit42/client-library/icons/Circle2Toggleforward";
import CloseIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import { useAppShell } from "./AppShellContext";
import { Button } from "@grit42/client-library/components";
import { useTheme } from "@grit42/client-library/hooks";
import styles from "./navbar.module.scss";
import { classnames } from "@grit42/client-library/utils";
import Logo42 from "../../../assets/42-logo.svg";
import LogoGrit42 from "../../../assets/resized-grit42-logo.svg";

const stopEventPropagation = (e: React.MouseEvent) => e.stopPropagation();

const Sidebar = ({ navItems }: { navItems: NavItem[] }) => {
  const { open, toggleNavbar } = useAppShell().navbar;
  const { data: session } = useSession();
  const availableNavItems = useMemo(
    () =>
      session
        ? navItems.filter(({ roles }) => !roles || hasRoles(session, roles))
        : [],
    [navItems, session],
  );

  const { colorScheme } = useTheme();

  return (
    <div
      className={classnames(styles.navbar, {
        [styles.open]: open,
      })}
      onClick={stopEventPropagation}
    >
      <Link to="/" className={styles.header}>
        <img
          className={classnames(styles.gritLogo, {
            [styles.light]: colorScheme === "light",
          })}
          src={open ? LogoGrit42 : Logo42}
          alt="grit42 logo"
        />
      </Link>
      <nav className={styles.nav}>
        {availableNavItems.map((navItem) => (
          <NavLink key={navItem.identifier} to={navItem.path}>
            {({ isActive }) => (
              <Button
                size="tiny"
                className={classnames(styles.sidebarButton, styles.navLink, {
                  [styles.active]: isActive,
                  [styles.open]: open,
                })}
                icon={
                  navItem.icon ? (
                    <navItem.icon height={24} />
                  ) : (
                    <CloseIcon height={24} />
                  )
                }
              >
                {open ? navItem.name : undefined}
              </Button>
            )}
          </NavLink>
        ))}
      </nav>
      <div className={styles.footer}>
        <Button
          onClick={toggleNavbar}
          size="tiny"
          className={classnames(styles.closeButton)}
          icon={open ? <CloseIcon /> : <OpenIcon />}
        >
          {open && "Collapse sidebar"}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
