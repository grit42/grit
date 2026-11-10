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

import { Row } from "@tanstack/react-table";
import { CellValuePropagationDirection } from "../types";

/**
 * Which rows a "Propagate..." action should write to, given the table's
 * *currently sorted* rows and the row the action was triggered from.
 * "up"/"down" follow sort order (the position of `sourceRowIndex` within
 * `sortedRows`, not `sourceRowIndex` itself), "column" is every other row,
 * "selected" is whichever rows are checked regardless of sort position.
 */
export default function getPropagationTargetRows<T>(
  sortedRows: Row<T>[],
  sourceRowIndex: number,
  direction: CellValuePropagationDirection,
): Row<T>[] {
  const sortedRowIndex = sortedRows.findIndex(
    (row) => row.index === sourceRowIndex,
  );

  if (direction === "selected") {
    return sortedRows.filter((row) => row.getIsSelected());
  }
  if (direction === "column") {
    const rows = [...sortedRows];
    rows.splice(sortedRowIndex, 1);
    return rows;
  }
  if (direction === "up") {
    return sortedRows.slice(0, sortedRowIndex);
  }
  return sortedRows.slice(sortedRowIndex + 1);
}
