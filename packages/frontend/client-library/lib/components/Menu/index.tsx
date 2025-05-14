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

import classnames from "../../utils/classnames";
import styles from "./menu.module.scss";

export type MenuItem = {
  id: string;
  text: string;
  icon?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
  disabled?: boolean;
};

export type MenuItems = MenuItem[];

interface Props {
  className?: string;
  menuItems: MenuItems;
}

const Menu = ({ className, menuItems }: Props) => {
  return (
    <div className={classnames(styles.menu, className)}>
      {menuItems.map((item) => {
        return (
          <li
            key={item.id}
            onClick={(e) => {
              e.preventDefault();
              if (item.onClick && !item.disabled) item.onClick(e);
            }}
            className={classnames(styles.menuItem, {
              [styles.disabled as unknown as string]: !!item.disabled,
            })}
          >
            <a>
              {item.icon}
              <p>{item.text}</p>
            </a>
          </li>
        );
      })}
    </div>
  );
};

export default Menu;
