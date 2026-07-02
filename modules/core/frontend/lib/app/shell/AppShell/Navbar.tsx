import { Link, NavLink } from "react-router-dom";
import { NavItem } from "../../navigation";
import { hasRoles, useSession } from "../../../features/auth";
import { useMemo } from "react";
import OpenIcon from "@grit42/client-library/icons/PlusSquare";
import { useAppShell } from "./AppShellContext";
import { Button } from "@grit42/client-library/components";
import styles from "./navbar.module.scss";
import { classnames } from "@grit42/client-library/utils";
import Logo42 from "../../../assets/42-logo.svg";
import LogoGrit42 from "../../../assets/resized-grit42-logo.svg";
import FwIcon from "@grit42/client-library/icons/Circle3Forward";
import BwIcon from "@grit42/client-library/icons/Circle3Backward";

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

  return (
    <div className={classnames(styles.navbar, { [styles.open]: open })}>
      <Link to="/" className={styles.logoLink}>
        <img
          className={styles.gritLogo}
          src={open ? LogoGrit42 : Logo42}
          alt="grit42 logo"
        />
      </Link>
      <div className={styles.divider} />
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
              >
                <OpenIcon />
                {open && navItem.name}
              </Button>
            )}
          </NavLink>
        ))}
      </nav>
      <div className={styles.divider} />
      <Button onClick={toggleNavbar} size="tiny" className={classnames(styles.sidebarButton, styles.closeButton)}>
        {open ? <BwIcon /> : <FwIcon />}
        {open && "Collapse sidebar"}
      </Button>
    </div>
  );
};

export default Sidebar;
