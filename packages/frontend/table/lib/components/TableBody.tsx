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

import { Cell, flexRender, Row, Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import styles from "./table.module.scss";
import { useMemo, useRef } from "react";
import { classnames } from "@grit42/client-library/utils";
import { Spinner } from "@grit42/client-library/components";
import { useDisplayDensity } from "@grit42/client-library/hooks";
import { GritTypedColumnDef, TableProps, TableStateSettings } from "../types";
import { getIsFiltersActive } from "../features/filters";
import useInternalTableState from "../features/table-state/useInternalTableState";
import Marvin03Meh from "@grit42/client-library/icons/Marvin03Meh";

type Props<T> = Pick<
  TableProps<T>,
  | "onRowClick"
  | "onCellClick"
  | "data"
  | "loading"
  | "noDataMessage"
  | "disableNoDataMessage"
  | "emphasizedRows"
> & {
  data: T[];
  table: Table<T>;
  tableContainer: HTMLDivElement | null;
  settings?: TableStateSettings<T>;
};

const TableCell = <T,>({
  onCellClick,
  data,
  cell,
  row,
}: Pick<Props<T>, "onCellClick" | "data"> & {
  data: T[];
  cell: Cell<T, unknown>;
  row: Row<T>;
}) => {
  const isNumericType = useMemo(
    () => ["integer", "decimal", "float"].includes((cell.column.columnDef as GritTypedColumnDef).type),
    [cell.column.columnDef],
  );
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const isColumnClickable =
    onCellClick !== undefined &&
    onCellClick[0].includes(cell.column.id as keyof T);
  return (
    <td
      ref={cellRef}
      onClick={(e) => {
        if (cell.id === "select-row") {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isColumnClickable) {
          if (!cellRef.current) throw new Error("Cell ref is null");

          onCellClick[1](
            row,
            cell.column.id as keyof T,
            cellRef.current,
            data[row.index]![cell.column.id as keyof T],
            e,
          );
        }
      }}
      className={classnames({
        [styles.clickable]: isColumnClickable,
      })}
      style={{
        width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
      }}
    >
      <div
        className={styles.cellContentContainer}
        style={{
          textAlign: isNumericType ? "end" : undefined,
          width: `calc(var(--col-${cell.column.id}-size) * 1px - var(--spacing) / 2)`,
        }}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </div>
    </td>
  );
};

const TableBody = <T,>({
  table,
  tableContainer,
  onRowClick,
  onCellClick,
  data,
  loading,
  disableNoDataMessage,
  noDataMessage,
  settings,
  emphasizedRows,
}: Props<T>) => {
  const displayDensity = useDisplayDensity();

  const { rows } = table.getRowModel();

  const { filters } = useInternalTableState();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => (displayDensity === "comfortable" ? 36 : 24),
    getScrollElement: () => tableContainer,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  const isFiltersActive = useMemo(
    () => !settings?.disableFilters && getIsFiltersActive(filters),
    [filters, settings?.disableFilters],
  );

  const isRowClickable = !!onRowClick;

  return (
    <tbody
      className={classnames({ [styles.emptyTable]: loading || !data.length })}
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
      }}
    >
      {loading && (
        <tr className={styles.emptyTable}>
          <td>
            <Spinner />
          </td>
        </tr>
      )}
      {!loading &&
        data &&
        data.length > 0 &&
        rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index] as Row<T>;
          return (
            <tr
              data-index={virtualRow.index}
              ref={(node) => rowVirtualizer.measureElement(node)}
              className={classnames({
                [styles.clickable]: isRowClickable,
                [styles.emphasized]: !!emphasizedRows?.[row.id],
              })}
              onClick={(e) => {
                if (onRowClick !== undefined) {
                  onRowClick(row, e);
                }
              }}
              key={row.id}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  cell={cell}
                  row={row}
                  onCellClick={onCellClick}
                  data={data}
                />
              ))}
            </tr>
          );
        })}
      {!loading && (!data || data.length === 0) && !disableNoDataMessage && (
        <tr className={styles.emptyTable}>
          <td>
            <Marvin03Meh className={styles.icon} height={150} />
            <h3>
              {isFiltersActive
                ? "All rows are filtered"
                : noDataMessage
                  ? noDataMessage
                  : "No data"}
            </h3>
          </td>
        </tr>
      )}
    </tbody>
  );
};

export default TableBody;
