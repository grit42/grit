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

import styles from "./table.module.scss";

import TableFooter from "./TableFooter";
import TableHead from "./TableHead";
import TableBody from "./TableBody";
import TableDndProvider from "./TableDndProvider";
import { classnames } from "@grit42/client-library/utils";
import { TableProps } from "../types";
import InternalTableStateContext from "../features/table-state/InternalTableStateContext";
import TableHeader from "./TableHeader";
import useTableCore from "./useTableCore";

const Table = <T,>({
  header,
  className,
  disableNoDataMessage,
  noDataMessage,
  ...props
}: TableProps<T>) => {
  const {
    displayDensity,
    settings,
    table,
    tableState,
    columnOrder,
    columnSizeVars,
    tableContainer,
    setTableContainer,
    fetchMoreOnBottomReached,
    displayData,
  } = useTableCore(props, styles);

  return (
    <InternalTableStateContext.Provider value={tableState}>
      <TableDndProvider table={table}>
        <div
          className={classnames(styles.container, className, {
            [styles.noFooter]: !!props.disableFooter,
            [styles.fitContent]: !!props.fitContent,
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
                data={displayData}
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
              loadedRecords={props.data?.length}
              totalRecords={props.pagination?.totalRows}
            />
          )}
        </div>
      </TableDndProvider>
    </InternalTableStateContext.Provider>
  );
};

export default Table;
