/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/table.
 *
 * @grit42/table is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/table is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/table. If not, see <https://www.gnu.org/licenses/>.
 */

import { useCallback } from "react";
import { Row, Table } from "@tanstack/react-table";
import { Dropdown, MenuItems } from "@grit42/client-library/components";
import MenuIcon from "@grit42/client-library/icons/Menu";
import styles from "./table.module.scss";
import { CellValuePropagationDirection, GritTypedColumnDef } from "../types";
import { useColumnTypeDef } from "../features/column-types";
import getPropagationTargetRows from "./getPropagationTargetRows";

interface Props<T> {
  table: Table<T>;
  row: Row<T>;
  column: GritTypedColumnDef;
  getValue: () => unknown;
}

/**
 * The "..." menu shown on every editable cell. Copies that cell's current
 * value to other rows in the same column — "up"/"down" follow the table's
 * current sort order (not row-array order), "in column" hits every other
 * row, and "to selection" (shown only when rows are checked) hits just
 * those. Resolving the value to propagate (e.g. re-fetching an entity
 * record for an entity column) is delegated to the column type's
 * `edit.resolvePropagatedValue`, since this component has no idea how to
 * look anything up itself.
 */
const PropagateMenu = <T,>({ table, row, column, getValue }: Props<T>) => {
  const typeDef = useColumnTypeDef(column.type);
  const selectedRows = table.getSelectedRowModel().flatRows;

  const propagate = useCallback(
    async (direction: CellValuePropagationDirection) => {
      const { rows } = table.getSortedRowModel();
      const editedRows = getPropagationTargetRows(rows, row.index, direction);

      const rawValue = getValue();
      const resolved = (await typeDef.edit?.resolvePropagatedValue?.(
        rawValue,
        column,
      )) ?? { value: rawValue };

      table.options.meta?.updateRows(
        editedRows,
        column.id as keyof T,
        resolved.value,
        resolved.entityData,
        column.type,
      );
    },
    [table, row.index, column, typeDef, getValue],
  );

  const menuItems: MenuItems = [
    { id: "up", text: "Propagate value up", onClick: () => propagate("up") },
    {
      id: "down",
      text: "Propagate value down",
      onClick: () => propagate("down"),
    },
    {
      id: "all",
      text: "Propagate value in column",
      onClick: () => propagate("column"),
    },
    ...(selectedRows.length > 0
      ? [
          {
            id: "selected",
            text: "Propagate value to selection",
            onClick: () => propagate("selected"),
          },
        ]
      : []),
  ];

  return (
    <Dropdown placement="bottom-start" menuItems={menuItems}>
      <MenuIcon className={styles.menuIcon} height={16} />
    </Dropdown>
  );
};

export default PropagateMenu;
