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

import { SortingState } from "@tanstack/react-table";
import { GritColumnDef } from "../../types";
import useLocalOrStoredState from "../../useLocalOrStoredState";
import { useMemo } from "react";
import { getLeafColumns } from "../../utils";

/**
 * Use this to setup custom sorting to use outside of the Table component.
 * @param id - ID of the table
 * @param saveState - If true, the state will be saved in local storage
 * @returns [sorting, setSorting]
 */
function useSort<T>(
  id: string,
  columns: GritColumnDef<T>[],
  initialState: SortingState = [],
  saveState = true,
) {
  const [sort, setSort] = useLocalOrStoredState(
    `${id}_sorting`,
    initialState,
    saveState,
  );
  const safeSort = useMemo(() => {
    const leafColumns = getLeafColumns(columns);
    return sort.filter((f) => leafColumns.find(({ id }) => f.id === id));
  }, [columns, sort]);

  return [safeSort, setSort] as const;
}

export default useSort;
