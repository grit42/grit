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

import { useMemo } from "react";
import { GritColumnDef } from "../../types";
import { Filter } from "./types";
import useLocalOrStoredState from "../../useLocalOrStoredState";
import { getLeafColumns } from "../../utils";

/**
 * Use this to setup custom filters to use outside of the Table component.
 * @param id - ID of the table
 * @param clientSideFiltering  - If true, filtering is done client side
 * @param initialFilters - A list of filters you want to be applied on initial render
 * @param saveState - If true, the filters will be saved in local storage
 * @returns [filters, setFilters] - filters is the current filters, setFilters is a function to set the filters
 */
function useFilters<T>(
  id: string,
  columns: GritColumnDef<T>[],
  initialFilters: Filter[] = [],
  saveState = true,
) {
  const filterInitialState = useMemo(
    () => initialFilters ?? [],
    [initialFilters],
  );

  const [filters, setFilters] = useLocalOrStoredState(
    `${id}_filters`,
    filterInitialState,
    saveState,
  );

  const safeFilters = useMemo(() => {
    const leafColumns = getLeafColumns(columns);
    return filters.filter((f) => leafColumns.find(({ id }) => f.column === id));
  }, [columns, filters]);

  return [safeFilters, setFilters] as const;
}

export default useFilters;
