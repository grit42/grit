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

import { GroupColumnDef, RowData } from "@tanstack/react-table";
import { GritColumnDef, GritGroupColumnDef, GritTypedColumnDef } from "./types";

export const getLeafColumns = <T>(
  columns: GritColumnDef<T>[],
): GritColumnDef<T>[] => {
  return columns.flatMap((column) => {
    if ((column as GroupColumnDef<T>).columns) {
      return getLeafColumns(
        (column as GroupColumnDef<T>).columns as GritColumnDef<T>[],
      );
    }

    return column;
  });
};

export const getLeafColumnsWithGroupLabels = <TData extends RowData, TValue = unknown>(
  columns: GritColumnDef<TData, TValue>[],
  groupColumn?: GritColumnDef<TData, TValue>,
): GritTypedColumnDef<TData, TValue>[] => {
  return columns.flatMap((c) => {
    if ((c as GritGroupColumnDef<TData, TValue>).columns) {
      return getLeafColumnsWithGroupLabels(
        (c as GritGroupColumnDef<TData, TValue>).columns ?? [],
        c,
      );
    }

    return [
      {
        ...c,
        header: groupColumn ? `${groupColumn.header} ${c.header}` : c.header,
      } as GritTypedColumnDef<TData, TValue>,
    ];
  });
};

