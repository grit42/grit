/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/client-library.
 *
 * @grit42/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import Popover from "../Popover";
import classnames from "../../utils/classnames";
import Menu, { MenuItems } from "../Menu";
import styles from "./dropdown.module.scss";
import { Placement } from "@floating-ui/react";

interface Props {
  className?: string;
  title?: string;
  placement?: Placement;
  menuItems: MenuItems;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Dropdown = ({
  placement,
  className,
  menuItems,
  children,
  title,
  disabled,
}: Props) => {
  return (
    <Popover
      placement={placement ?? "bottom-start"}
      disabled={disabled}
      content={
        <>
          {title && <div className={styles.title}>{title}</div>}
          <Menu
            className={classnames(styles.dropdown, className)}
            menuItems={menuItems}
          />
        </>
      }
    >
      <span className={styles.trigger}>{children}</span>
    </Popover>
  );
};

export default Dropdown;
