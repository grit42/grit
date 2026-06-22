import { NavLink } from "react-router-dom";
import { NavItem } from "../../navigation";
import { hasRoles, useSession } from "../../../features/auth";
import { useMemo } from "react";
import Circle1CloseIcon from "@grit42/client-library/icons/Circle1Close";
import { useNavbar } from "./AppShellContext";
import { Button } from "@grit42/client-library/components";
import styles from "./navbar.module.scss";
import { classnames } from "@grit42/client-library/utils";

const Sidebar = ({ navItems }: { navItems: NavItem[] }) => {
  const { open, toggleNavbar } = useNavbar();
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
      <Button onClick={toggleNavbar} size="tiny" className={styles.closeButton}>
        <Circle1CloseIcon height={16} />
      </Button>
      {availableNavItems.map((navItem) => (
        <NavLink key={navItem.identifier} to={navItem.path}>
          {({ isActive }) => (
            <Button
              size="tiny"
              className={classnames(styles.navLink, {
                [styles.active]: isActive,
                [styles.open]: open,
              })}
            >
              <Circle1CloseIcon height={16} fill={"white"} />
              {open && <span>{navItem.name}</span>}
            </Button>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;
