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
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  RowSelectionState,
  Updater,
  useReactTable,
} from "@tanstack/react-table";

import { useCallback, useEffect, useMemo, useState } from "react";

import styles from "./table.module.scss";

import TableFooter from "./TableFooter";
import TableHead from "./TableHead";
import TableBody from "./TableBody";
import TableDndProvider from "./TableDndProvider";
import useSetupTableState from "../features/table-state/useSetupTableState";
import { classnames, generateUniqueID } from "@grit/client-library/utils";
import DeleteIcon from "@grit/client-library/icons/Delete";
import CloneIcon from "@grit/client-library/icons/Clone";
import { Checkbox, Tooltip } from "@grit/client-library/components";
import { useDisplayDensity } from "@grit/client-library/hooks";
import {
  GritColumnDef,
  StatelessTableProps,
  TableProps,
  TableStateSettings,
} from "../types";
import useClientSideFilters from "../features/filters/useClientSideFilters";
import InternalTableStateContext from "../features/table-state/InternalTableStateContext";
import useSkipper from "../useSkipper";
import TableHeader from "./TableHeader";

const FALLBACK_DATA: unknown[] = [];

const Table = <T,>({
  header,
  data,
  onSelect,
  getRowId,
  className,
  disableNoDataMessage,
  noDataMessage,
  ...props
}: TableProps<T>) => {
  const displayDensity = useDisplayDensity();

  if (!("tableState" in props) && !("columns" in props)) {
    throw new Error("No columns or tableState provided");
  }

  const propsTableState = props.tableState;
  const internalTableState = useSetupTableState(
    generateUniqueID("table-state"),
    props.tableState ? [] : (props as StatelessTableProps<T>).columns,
    {
      saveState: false,
    },
  );

  const tableState = useMemo(
    () => propsTableState ?? internalTableState,
    [propsTableState, internalTableState],
  );

  const {
    columns,
    options: tableOptions,

    columnVisibility,

    rowSelection,
    setRowSelection,

    columnSizing,
    setColumnSizing,

    columnOrder,
    setColumnOrder,

    sorting,
    setSorting,

    setSelectAllState,

    expandedRows,
    setExpandedRows,
  } = tableState;

  const settings = (
    "settings" in props ? props.settings : tableOptions.settings
  ) as TableStateSettings<T> | undefined;

  const [tableContainer, setTableContainer] = useState<HTMLDivElement | null>(
    null,
  );

  const [autoResetPageIndex] = useSkipper();

  const columnsWithActions = useMemo(() => {
    const columnsBefore: GritColumnDef<T>[] = [];
    const columnsAfter: GritColumnDef<T>[] = [];
    if (settings?.enableSelection) {
      columnsBefore.push({
        id: "select-row",
        maxSize: 40,
        enableSorting: false,
        enableResizing: false,
        type: "action",
        header: ({ table, header }) => (
          <div className={styles.headerCheckbox}>
            <Checkbox
              id={header.id}
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onChange={(e) => {
                if (e.currentTarget.checked) {
                  setSelectAllState(table.getSortedRowModel().rows.length);
                } else {
                  setSelectAllState(null);
                }

                table.getToggleAllRowsSelectedHandler()(e);
              }}
            />
          </div>
        ),
        cell: ({ row, cell }) => (
          <div className={styles.rowCheckbox}>
            <Checkbox
              id={cell.id}
              checked={row.getIsSelected()}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
      });
    }
    if (props.rowActions?.length) {
      columnsAfter.push({
        id: "row-actions",
        maxSize: props.rowActions.length * 40,
        enableSorting: false,
        enableResizing: false,
        type: "action",
        header: () => <div className={styles.headerControls} />,
        cell: ({ row, table }) => {
          return (
            <div className={styles.rowControls}>
              {props.rowActions?.includes("clone") && (
                <Tooltip content={"Clone"}>
                  <CloneIcon
                    focusable={true}
                    className={styles.icon}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (props.onClone) await props.onClone(row);
                    }}
                  />
                </Tooltip>
              )}

              {props.rowActions?.includes("delete") && (
                <Tooltip
                  content={
                    table.getSelectedRowModel().rows.length > 1
                      ? `Delete ${
                          table.getSelectedRowModel().rows.length
                        } selected rows`
                      : "Delete"
                  }
                  disabled={
                    table.getSelectedRowModel().rows.length > 1 &&
                    !row.getIsSelected()
                  }
                >
                  <DeleteIcon
                    focusable={true}
                    className={classnames(styles.icon, styles.delete, {
                      [styles.disabled as string]:
                        table.getSelectedRowModel().rows.length > 1 &&
                        !row.getIsSelected(),
                    })}
                    onClick={async (e) => {
                      e.stopPropagation();

                      const selectedRows = table.getSelectedRowModel().rows;

                      if (selectedRows.length > 1) {
                        await props.onDelete?.(selectedRows);
                        return;
                      } else {
                        await props.onDelete?.([row]);
                      }

                      setSelectAllState(0);
                      table.toggleAllRowsSelected(false);
                    }}
                  />
                </Tooltip>
              )}
            </div>
          );
        },
      });
    }
    if (!columnsBefore.length && !columnsAfter.length) {
      return columns;
    }
    return [...columnsBefore, ...columns, ...columnsAfter];
  }, [columns, props, setSelectAllState, settings?.enableSelection]);

  const columnOrderWithActions = useMemo(() => {
    const columnsBefore: string[] = [];
    const columnsAfter: string[] = [];
    if (settings?.enableSelection) columnsBefore.push("select-row");
    // if (props.renderSubComponent) columnsBefore.push("expand-row");
    if (props.rowActions?.length) columnsAfter.push("row-actions");
    if (!columnsBefore.length && !columnsAfter.length) return columnOrder;
    return [...columnsBefore, ...columnOrder, ...columnsAfter];
  }, [
    columnOrder,
    // props.renderSubComponent,
    props.rowActions?.length,
    settings?.enableSelection,
  ]);

  const displayData = useClientSideFilters(
    !!settings?.clientSideSortAndFilter,
    data ?? (FALLBACK_DATA as T[]),
    tableState.filters,
  );

  const table = useReactTable({
    enableSorting: settings?.disableColumnSorting ? false : true,
    defaultColumn: {
      sortDescFirst: false,
    },
    getRowId,
    columns: columnsWithActions,
    data: displayData,
    columnResizeMode: "onChange",
    autoResetPageIndex,
    state: {
      columnVisibility,
      rowSelection,
      columnOrder: columnOrderWithActions,
      ...(!settings?.disableColumnSorting ? { sorting } : {}),
      columnSizing: columnSizing,
      expanded: expandedRows,
    },
    onColumnSizingChange: settings?.disableColumnSizing
      ? undefined
      : setColumnSizing,
    enableColumnResizing: settings?.disableColumnSizing ? false : true,
    onRowSelectionChange: useCallback(
      (updater: Updater<RowSelectionState>) => {
        const newState =
          typeof updater === "object" ? updater : updater(rowSelection);

        setRowSelection(updater);
        if (onSelect) onSelect(newState);
      },
      [rowSelection, onSelect, setRowSelection],
    ),

    onColumnOrderChange: settings?.disableColumnReorder
      ? undefined
      : setColumnOrder,
    onSortingChange: settings?.disableColumnSorting ? undefined : setSorting,
    onExpandedChange: setExpandedRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: settings?.clientSideSortAndFilter ? false : true,
    debugTable: import.meta.env.DEV,
  });

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    table.getFlatHeaders(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    table.getState().columnSizing,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    table.getState().columnSizingInfo,
  ]);

  const { isFetchingNextPage, fetchNextPage, totalRows } =
    props.pagination ?? {};

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        //once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
        if (
          scrollHeight - scrollTop - clientHeight < 500 &&
          !(props.loading || isFetchingNextPage) &&
          (data?.length ?? 0) < (totalRows ?? 0) &&
          fetchNextPage
        ) {
          fetchNextPage();
        }
      }
    },
    [props.loading, isFetchingNextPage, data?.length, totalRows, fetchNextPage],
  );

  useEffect(() => {
    fetchMoreOnBottomReached(tableContainer);
  }, [fetchMoreOnBottomReached, tableContainer]);

  return (
    <InternalTableStateContext.Provider value={tableState}>
      <TableDndProvider table={table}>
        <div
          className={classnames(styles.container, className, {
            [styles.noFooter]: !!props.disableFooter,
          })}
        >
          <TableHeader
            settings={settings}
            table={table}
            title={header}
            leftActions={props.leftHeaderActions}
            rightActions={props.headerActions}
          />
          <div
            className={classnames(styles.tableContainer, {
              [styles.noFooter]: !!props.disableFooter,
            })}
            ref={setTableContainer}
            onScroll={(e) =>
              fetchMoreOnBottomReached(e.target as HTMLDivElement)
            }
          >
            <table
              className={classnames({
                [styles.compact]: displayDensity === "compact",
              })}
              style={{
                ...columnSizeVars,
              }}
            >
              <TableHead
                table={table}
                columnOrder={columnOrder}
                settings={settings}
              />
              <TableBody
                table={table}
                tableContainer={tableContainer}
                onCellClick={props.onCellClick}
                onRowClick={props.onRowClick}
                data={data ?? (FALLBACK_DATA as T[])}
                loading={props.loading}
                settings={settings}
                noDataMessage={noDataMessage}
                disableNoDataMessage={disableNoDataMessage}
                emphasizedRows={props.emphasizedRows}
              />
            </table>
          </div>
          {props.disableFooter ? null : (
            <TableFooter
              loadedRecords={data?.length}
              totalRecords={props.pagination?.totalRows}
            />
          )}
        </div>
      </TableDndProvider>
    </InternalTableStateContext.Provider>
  );
};

export default Table;
