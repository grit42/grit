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

import { VisibilityState } from "@tanstack/react-table";
import { GritColumnDef } from "../../types";
import { useMemo } from "react";
import { getDefaultColumnVisibility } from "./utils";
import useLocalOrStoredState from "../../useLocalOrStoredState";

/**
 * Use this to setup custom column visibility to use outside of the Table component.
 * @param id - ID of the table
 * @param columns - Columns of the table
 * @param saveState - If true, the state will be saved in local storage
 * @returns [columnVisibility, setColumnVisibility] - Column visibility state and setter
 */
function useColumnVisiblity<T>(
  id: string,
  columns: GritColumnDef<T>[],
  initialColumnVisibility: VisibilityState | null = null,
  saveState = true,
) {
  const initialState = useMemo(
    () => initialColumnVisibility ?? getDefaultColumnVisibility<T>(columns),
    [columns, initialColumnVisibility],
  );

  return useLocalOrStoredState(`${id}_columnsVisible`, initialState, saveState);
}

export default useColumnVisiblity;
