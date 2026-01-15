/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import styles from "./sideBar.module.scss";
import { classnames } from "@grit42/client-library/utils";

const SidebarItem = ({
  label,
  identifier,
  active,
  onClick,
}: {
  label: string;
  identifier: string;
  active: boolean;
  onClick: (id: string) => void;
}) => {
  return (
    <div className={styles.sidebarItem} onClick={() => onClick(identifier)}>
      <div
        className={classnames(styles.sidebarItemText, {
          [styles.active]: active,
        })}
      >
        {label}
      </div>
    </div>
  );
};

const Sidebar = ({ children }: React.PropsWithChildren) => {
  return <div className={styles.sidebar}>{children}</div>;
};

Sidebar.Item = SidebarItem;

export default Sidebar;
