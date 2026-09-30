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
import { Cell, flexRender, Table } from "@tanstack/react-table";
import styles from "./table.module.scss";
import { GritTypedColumnDef } from "../types";
import { useColumnTypeDef } from "../features/column-types";
import PropagateMenu from "./PropagateMenu";

interface Props<T> {
  cell: Cell<T, unknown>;
  table: Table<T>;
}

/**
 * Renders an editable cell for a column whose type has an `edit.input`
 * registered (via `ColumnTypeDefProvider`) — falls back to the column's
 * normal (read-only) `cell` renderer for columns whose type isn't
 * registered as editable, even when the column itself has `editable: true`
 * set, matching how an unsupported filter/edit type degrades gracefully
 * rather than erroring.
 */
const EditableCell = <T,>({ cell, table }: Props<T>) => {
  const columnDef = cell.column.columnDef as GritTypedColumnDef;
  const typeDef = useColumnTypeDef(columnDef.type);
  const Input = typeDef.edit?.input;

  const updateData = useCallback(
    (newValue: unknown, entityData?: unknown) => {
      table.options.meta?.updateData(
        cell.row.index,
        columnDef.id as keyof T,
        newValue,
        entityData,
        columnDef.type,
      );
    },
    [table, cell.row.index, columnDef],
  );

  if (!Input) {
    return flexRender(cell.column.columnDef.cell, cell.getContext());
  }

  return (
    <span className={styles.editableCell}>
      <Input
        id={`cell-input-${cell.row.id}-${columnDef.id}`}
        value={cell.getValue()}
        row={cell.row.original}
        column={columnDef}
        onChange={updateData}
      />
      <PropagateMenu
        table={table}
        row={cell.row}
        column={columnDef}
        getValue={cell.getValue}
      />
    </span>
  );
};

export default EditableCell;
