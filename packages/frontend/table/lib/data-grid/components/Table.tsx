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

import { useState } from "react";

import styles from "./dataGrid.module.scss";

import TableFooter from "./TableFooter";
import TableHead from "../../components/TableHead";
import TableBody from "../../components/TableBody";
import TableDndProvider from "../../components/TableDndProvider";
import { classnames } from "@grit42/client-library/utils";
import { GritColumnDef, TableProps } from "../../types";
import InternalTableStateContext from "../../features/table-state/InternalTableStateContext";
import PermanentFilters from "../features/filters/PermanentFilters";
import { ColumnVisibility } from "../features/column-visibility";
import TableHeader from "./TableHeader";
import useTableCore from "../../components/useTableCore";

const Table = <T,>({
  className,
  disableNoDataMessage,
  noDataMessage,
  headerActions,
  ...props
}: TableProps<T>) => {
  const {
    displayDensity,
    settings,
    table,
    tableState,
    columns,
    columnOrder,
    columnVisibility,
    columnSizeVars,
    tableContainer,
    setTableContainer,
    fetchMoreOnBottomReached,
    displayData,
  } = useTableCore(props, styles);

  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <InternalTableStateContext.Provider value={tableState}>
      <TableDndProvider table={table}>
        <div
          style={{
            display: "grid",
            gridTemplateRows: "1fr",
            gridTemplateColumns: showFilters ? "max-content 1fr" : "1fr",
            gridAutoFlow: "column",
            gridAutoColumns: "max-content",
            overflow: "auto",
          }}
        >
          {showFilters && (
            <PermanentFilters
              columns={
                columns
                  .filter(({ id }) => columnVisibility[id] ?? true)
                  .sort((a, b) => {
                    const indexA = columnOrder.indexOf(a.id as string);
                    const indexB = columnOrder.indexOf(b.id as string);

                    if (indexA < indexB) return -1;
                    if (indexA > indexB) return 1;

                    return 0;
                  }) as GritColumnDef[]
              }
              filters={tableState.filters}
              setFilters={tableState.setFilters}
              setShowFilters={setShowFilters}
            />
          )}
          <div
            className={classnames(styles.container, className, {
              [styles.fitContent]: !!props.fitContent,
            })}
          >
            <TableHeader
              table={table}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              actions={headerActions}
            />
            <div
              className={classnames(styles.tableContainer)}
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
                  data={displayData}
                  loading={props.loading}
                  settings={settings}
                  noDataMessage={noDataMessage}
                  disableNoDataMessage={disableNoDataMessage}
                  emphasizedRows={props.emphasizedRows}
                />
              </table>
            </div>
            <TableFooter
              loadedRecords={props.data?.length}
              totalRecords={props.pagination?.totalRows}
            />
          </div>
          {showSettings && (
            <ColumnVisibility setShowSettings={setShowSettings} />
          )}
        </div>
      </TableDndProvider>
    </InternalTableStateContext.Provider>
  );
};

export default Table;
