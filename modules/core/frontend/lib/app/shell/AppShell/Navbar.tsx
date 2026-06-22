import { NavLink } from "react-router-dom";
import { NavItem } from "../../navigation";
import { hasRoles, useSession } from "../../../features/auth";
import { useMemo } from "react";
import CloseIcon from "@grit42/client-library/icons/MinusSquare";
import OpenIcon from "@grit42/client-library/icons/PlusSquare";
import { useNavbar } from "./AppShellContext";
import { Button, Tooltip } from "@grit42/client-library/components";
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
        {open ? <CloseIcon height={16} /> : <OpenIcon height={16} />}
      </Button>
      {availableNavItems.map((navItem) => (
        <NavLink key={navItem.identifier} to={navItem.path}>
          {({ isActive }) => (
            <Tooltip content={navItem.name} disabled={open} >
              <Button
                size="tiny"
                className={classnames(styles.navLink, {
                  [styles.active]: isActive,
                  [styles.open]: open,
                })}
              >
                <OpenIcon height={16} fill={"white"} />
                {open && <span>{navItem.name}</span>}
              </Button>
            </Tooltip>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;
