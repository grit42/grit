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

import { useMemo, useState } from "react";
import { Row, RowSelectionState } from "@tanstack/react-table";
import { GritColumnDef, GritTableState, TableStateOptions } from "../../types";
import { useFilters } from "../filters";
import { useColumnVisiblity } from "../column-visibility";
import { useColumnOrder } from "../column-order";
import { useColumnDescriptionVisibility } from "../column-description";
import { useSort } from "../sort";
import { useColumnSizing } from "../column-sizing";
import { useExpandedRows } from "../expandable-rows";

export default function useSetupTableState<T>(
  id: string,
  columns: GritColumnDef<T>[],
  options: TableStateOptions<T> = {},
): GritTableState<T> {
  const saveState = options.saveState ?? true;

  const columnVisibilityState = useColumnVisiblity(
    id,
    columns,
    options.initial?.visibility,
    typeof saveState === "boolean" ? saveState : saveState.columnVisibility,
  );

  // Get the users preferred column visibility from localStorage
  const [columnVisibility, setColumnVisibility] = useMemo(
    () => options.controlledState?.visibility ?? columnVisibilityState,
    [columnVisibilityState, options.controlledState?.visibility],
  );

  const visibleColumns = useMemo(
    () => columns.filter(({ id }) => columnVisibility[id] ?? true),
    [columns, columnVisibility],
  );

  const filtersState = useFilters(
    id,
    visibleColumns,
    options.initial?.filters,
    typeof saveState === "boolean" ? saveState : saveState.filters,
  );

  const [filters, setFilters] = useMemo(
    () => options.controlledState?.filter ?? filtersState,
    [filtersState, options.controlledState?.filter],
  );

  const sortState = useSort(
    id,
    columns,
    options.initial?.sorting,
    typeof saveState === "boolean" ? saveState : saveState.sorting,
  );

  const [sorting, setSorting] = useMemo(
    () => options.controlledState?.sort ?? sortState,
    [options.controlledState?.sort, sortState],
  );

  // Get the users customised column sizing from localStorage
  const [columnSizing, setColumnSizing] = useColumnSizing(
    id,
    options.initial?.sizing,
    typeof saveState === "boolean" ? saveState : saveState.columnSizing,
  );

  // Get the users preferred column order from localStorage
  const [columnOrder, setColumnOrder] = useColumnOrder(
    id,
    columns,
    options.initial?.order,
    (typeof saveState === "boolean" ? saveState : saveState.columnOrder) &&
      !options.settings?.disableColumnReorder,
  );

  // Row Selection
  const [selectAllState, setSelectAllState] = useState<number | null>(null);

  const [fetchingAll, setFetchingAll] = useState(false);
  const [rowSelection, setRowSelection] =
    options.controlledState?.select ??
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useState<RowSelectionState>(options.initial?.selection ?? {});
  const [confirmFetchAll, setConfirmFetchAll] = useState(false);

  const [descriptionVisible, setDescriptionVisibility] =
    useColumnDescriptionVisibility(
      id,
      options.settings?.enableColumnDescription,
      typeof saveState === "boolean"
        ? saveState
        : saveState.columnDescriptionVisibility,
    );

  const [isDeleting, setDeleting] = useState<Row<T>[] | null>(null);
  const [expandedRows, setExpandedRows] = useExpandedRows(
    id,
    options.initial?.expanded,
    typeof saveState === "boolean" ? saveState : saveState.expandedRows,
  );

  return {
    id,
    columns,
    options,

    columnVisibility,
    setColumnVisibility,

    rowSelection,
    setRowSelection,

    columnSizing,
    setColumnSizing,

    columnOrder,
    setColumnOrder,

    filters,
    setFilters,

    sorting,
    setSorting,

    selectAllState,
    setSelectAllState,

    fetchingAll,
    setFetchingAll,

    confirmFetchAll,
    setConfirmFetchAll,

    descriptionVisible,
    setDescriptionVisibility,

    expandedRows,
    setExpandedRows,

    isDeleting,
    setDeleting,
  };
}
