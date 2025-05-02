/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/table.
 *
 * @grit/table is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/table is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/table. If not, see <https://www.gnu.org/licenses/>.
 */

import { ColumnOrderState } from "@tanstack/react-table";
import { GritColumnDef } from "../../types";
import { useEffect, useMemo } from "react";
import { getDefaultColumnOrder } from "./utils";
import useLocalOrStoredState from "../../useLocalOrStoredState";
import { getLeafColumns } from "../../utils";

function useColumnOrder<T>(
    id: string,
    columns: GritColumnDef<T>[],
    initialColumnOrder: ColumnOrderState | null = null,
    saveState = true,
  ) {
    const defaultColumnOrder = useMemo(
      () => initialColumnOrder ?? getDefaultColumnOrder(columns),
      [columns, initialColumnOrder],
    );

    const [value, setValue] = useLocalOrStoredState(
      `${id}_columnOrder`,
      defaultColumnOrder,
      saveState,
    );

    useEffect(() => {
      const leafColumns = getLeafColumns(columns);
      if (!leafColumns.every(({ id }) => value.includes(id))) {
        const orderWithAllColumns = [
          ...value,
          ...leafColumns
            .filter(({ id }) => !value.includes(id))
            .map(({ id }) => id),
        ];
        setValue(orderWithAllColumns);
      }
    }, [columns, value, setValue]);

    return [value, setValue] as const;
  }

export default useColumnOrder;
