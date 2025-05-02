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

import {
  ColumnOrderState,
  ColumnSizingState,
  ExpandedState,
  Row,
  RowData,
  RowSelectionState,
  SortingState,
  VisibilityState,
  ColumnDefBase,
  AccessorFn,
  StringOrTemplateHeader,
} from "@tanstack/react-table";
import { Filter } from "./features/filters";

export interface GritColumnMeta<TData extends RowData, TValue> {
}

export type GritColumnDefBase<
  TData extends RowData,
  TValue = unknown,
> = ColumnDefBase<TData, TValue> & {
  id: string;
  type?: string;
  description?: string;
  defaultVisibility?: "visible" | "hidden";
  header?: StringOrTemplateHeader<TData, TValue>;
  meta?: GritColumnMeta<TData, TValue>;
};

export type GritDisplayColumnDef<
  TData extends RowData,
  TValue = unknown,
> = GritColumnDefBase<TData, TValue> & {
  type: string;
  header: StringOrTemplateHeader<TData, TValue>;
};

export interface GritGroupColumnDef<TData extends RowData, TValue = unknown>
  extends GritColumnDefBase<TData, TValue> {
  columns?: GritColumnDef<TData, any>[];
}
export interface GritAccessorFnColumnDef<
  TData extends RowData,
  TValue = unknown,
> extends GritColumnDefBase<TData, TValue> {
  accessorFn: AccessorFn<TData, TValue>;
  type: string;
  header: StringOrTemplateHeader<TData, TValue>;
}
export interface GritAccessorKeyColumnDef<
  TData extends RowData,
  TValue = unknown,
> extends GritColumnDefBase<TData, TValue> {
  accessorKey: (string & {}) | keyof TData;
  type: string;
  header: StringOrTemplateHeader<TData, TValue>;
}

export type GritAccessorColumnDef<TData extends RowData, TValue = unknown> =
  | GritAccessorKeyColumnDef<TData, TValue>
  | GritAccessorFnColumnDef<TData, TValue>;

export type GritTypedColumnDef<TData extends RowData = unknown, TValue = unknown> =
  | GritDisplayColumnDef<TData, TValue>
  | GritAccessorColumnDef<TData, TValue>;

export type GritColumnDef<TData extends RowData = unknown, TValue = unknown> =
  | GritDisplayColumnDef<TData, TValue>
  | GritGroupColumnDef<TData, TValue>
  | GritAccessorColumnDef<TData, TValue>;

export interface TablePaginationProps {
  isFetchingNextPage: boolean;

  /**
   * Use this when doing infinite scrolling (useInfiniteEntityData)
   */
  fetchNextPage: () => Promise<unknown>;

  /**
   * Total amount of data in the database
   */
  totalRows: number | undefined;
}

export interface GritTableState<T> {
  id: string;
  columns: GritColumnDef<T>[];
  options: TableStateOptions<T>;

  columnVisibility: VisibilityState;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;

  rowSelection: RowSelectionState;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;

  columnSizing: ColumnSizingState;
  setColumnSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>;

  columnOrder: ColumnOrderState;
  setColumnOrder: React.Dispatch<React.SetStateAction<ColumnOrderState>>;

  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;

  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;

  selectAllState: number | null;
  setSelectAllState: React.Dispatch<React.SetStateAction<number | null>>;

  fetchingAll: boolean;
  setFetchingAll: React.Dispatch<React.SetStateAction<boolean>>;

  confirmFetchAll: boolean;
  setConfirmFetchAll: React.Dispatch<React.SetStateAction<boolean>>;

  descriptionVisible: boolean;
  setDescriptionVisibility: React.Dispatch<React.SetStateAction<boolean>>;

  isDeleting: Row<T>[] | null;
  setDeleting: React.Dispatch<React.SetStateAction<Row<T>[] | null>>;

  expandedRows: ExpandedState;
  setExpandedRows: React.Dispatch<React.SetStateAction<ExpandedState>>;
}

export interface TableStateSettings<T> {
  /**
   * Should the data be filtered and sorted by the client?
   * @default false
   */
  clientSideSortAndFilter?: boolean;

  /**
   * Enable column description and visibility control
   */
  enableColumnDescription?: boolean;

  /**
   * Enable column order reset menu item
   */
  enableColumnOrderReset?: boolean;

  /**
   *  If true, the column visibility settings button will be disabled and hidden from the header.
   */
  disableVisibilitySettings?: boolean;

  /**
   * If true, the first column will be a checkbox that allows the user to select the row
   */
  enableSelection?: boolean;

  /**
   * Disable column reordering
   */
  disableColumnReorder?: boolean;

  /**
   * Disable column resizing
   */
  disableColumnSizing?: boolean;

  /**
   * Disable column sorting
   */
  disableColumnSorting?: boolean;

  /**
   * Disable and hide the filter button in the header.
   */
  disableFilters?: boolean;

  /**
   * Which columns should be filterable.
   */
  filterColumns?: GritColumnDef<T>[];
}

export interface TableStateControlledState {
  filter?: [
    filters: Filter[],
    setFilters: React.Dispatch<React.SetStateAction<Filter[]>>,
  ];

  sort?: [
    sorting: SortingState,
    setSorting: React.Dispatch<React.SetStateAction<SortingState>>,
  ];

  order?: [
    order: ColumnOrderState,
    setOrder: React.Dispatch<React.SetStateAction<ColumnOrderState>>,
  ];

  select?: [
    selection: RowSelectionState,
    setSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>,
  ];

  visibility?: [
    visibility: VisibilityState,
    setVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>,
  ];

  expanded?: [
    expanded: ExpandedState,
    setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>,
  ];
}

export interface TableStateOptions<T> {
  initial?: {
    /**
     * Provide initial filters.
     */
    filters?: Filter[];

    /**
     * Provide initial sorting.
     */
    sorting?: SortingState;

    /**
     * Provide initial order of columns.
     */
    order?: ColumnOrderState;

    /**
     * Provide initial selection.
     */
    selection?: RowSelectionState;

    /**
     * Provide initial column visibility settings.
     */
    visibility?: VisibilityState;

    /**
     * Provide initial column sizes.
     */
    sizing?: ColumnSizingState;

    expanded?: ExpandedState;
  };

  /**
   * Provide a controlled state for the table.
   */
  controlledState?: TableStateControlledState;

  /**
   * Set this to false, if you don't want to save any of the states in local storage.
   * @default true
   */
  saveState?:
    | {
        filters?: boolean;
        sorting?: boolean;
        columnVisibility?: boolean;
        columnOrder?: boolean;
        columnSizing?: boolean;
        columnDescriptionVisibility?: boolean;
        expandedRows?: boolean;
      }
    | boolean;

  settings?: TableStateSettings<T>;
}

interface DefaultTableProps<T> {
  /**
   * A title that will be shown above the table.
   */
  header?: string;

  /**
   * The rows to display in the table.
   */
  data?: T[];

  /**
   * Add extra classes to the table.
   */
  className?: string;

  /**
   * Is the data loading?:
   */
  loading?: boolean;

  /**
   * This function will be called, when the user clicks on a row.
   */
  onRowClick?: (
    row: Row<T>,
    event: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
  ) => void;

  /**
   * This function will be called, when the user clicks on a cell.
   */
  onCellClick?: [
    columns: (keyof T)[],
    callback: (
      row: Row<T>,
      columnName: keyof T,
      cellRef: HTMLTableCellElement,
      cellData: T[keyof T],
      event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
    ) => void,
  ];

  /**
   * This function will be called, when `enableSelection` is true,
   * and a row has been selected
   */
  onSelect?: (rows: RowSelectionState) => void;

  /**
   * This function will be called, when `delete` is added to the `rowActions` prop,
   * and one or multiple rows has been deleted
   */
  onDelete?: (rows: Row<T>[]) => void | Promise<void>;

  /**
   * This function will be called, when `clone` is added to the `rowActions` prop,
   * and a row has been cloned
   */
  onClone?: (row: Row<T>) => void | Promise<void>;

  /**
   * Specify what action icons and functions, should be available for each row.
   */
  rowActions?: ("delete" | "clone")[];

  /**
   * Extra actions to add to the header.
   */
  headerActions?: React.ReactNode;
  leftHeaderActions?: React.ReactNode;

  /**
   * Specify the message to show when there are no rows to display.
   */
  noDataMessage?: string;

  pagination?: TablePaginationProps;

  disableNoDataMessage?: boolean;

  disableFooter?: boolean;

  /**
   * Rows to emphasize in the manner of columns matching filters
   */
  emphasizedRows?: Record<string, boolean>;

  /**
   * Function to set the row id
   * @default use the row index
   */
  getRowId?: (
    originalRow: T,
    index: number,
    parent: Row<T> | undefined,
  ) => string;
}

export interface StatelessTableProps<T> extends DefaultTableProps<T> {
  /**
   * Setup a simple table with these passed columns to display in the table.
   */
  columns: GritColumnDef<T>[];
  settings?: Omit<TableStateSettings<T>, "clientSideSortAndFilter">;

  tableState?: never;
}

export interface StatefulTableProps<T> extends DefaultTableProps<T> {
  /**
   * Table state
   * @usage Initialize with useSetupTableState()
   */
  tableState: GritTableState<T>;

  columns?: never;
}

export type TableProps<T> = StatefulTableProps<T> | StatelessTableProps<T>;
