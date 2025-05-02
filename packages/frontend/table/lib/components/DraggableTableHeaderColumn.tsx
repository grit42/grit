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

import { flexRender, Header } from "@tanstack/react-table";

import { CSSProperties, useMemo } from "react";

import styles from "./table.module.scss";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { classnames } from "@grit/client-library/utils";
import IconArrowUp from "@grit/client-library/icons/IconArrowUp";
import IconArrowDown from "@grit/client-library/icons/IconArrowDown";
import { GritColumnDef, TableStateSettings } from "../types";
import useInternalTableState from "../features/table-state/useInternalTableState";

const DraggableTableHeaderColumn = <T,>({
  header,
  headers,
  settings,
}: {
  header: Header<T, unknown>;
  headers?: Header<T, unknown>[];
  settings?: TableStateSettings<T>;
}) => {
  const tableState = useInternalTableState();
  const isLeafHeader = useMemo(() => header.subHeaders.length === 0, [header]);
  const canDrag = useMemo(
    () =>
      !settings?.disableColumnReorder &&
      isLeafHeader &&
      header.column.id !== "select-row",
    [header.column.id, isLeafHeader, settings?.disableColumnReorder],
  );
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
      disabled: !canDrag,
    });

  const nextToPlaceholder = useMemo(
    () =>
      headers &&
      headers[header.index + 1] &&
      headers[header.index + 1].isPlaceholder &&
      !headers[header.index + 1].id.endsWith("row-actions"),
    [header.index, headers],
  );

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(
      transform ? { ...transform!, y: 0 } : null,
    ),
    transition: "width transform 0.2s ease-in-out",
    whiteSpace: "nowrap",
    width: `calc(var(--header-${header?.id}-size) * 1px)`,
    maxWidth: `calc(var(--header-${header?.id}-size) * 1px)`,
    zIndex: isDragging ? 1 : 0,
    borderInlineEnd: nextToPlaceholder ? "none" : undefined,
  };

  return (
    <th colSpan={header.colSpan} ref={setNodeRef} key={header.id} style={style}>
      <div className={styles.tableHeaderContainer}>
        <div
          className={styles.tableHeader}
          onClick={
            header.column.getCanSort()
              ? header.column.getToggleSortingHandler()
              : undefined
          }
        >
          {canDrag ? (
            <button
              className={classnames(styles.dragHandle, {
                [styles.dragging]: isDragging,
              })}
              {...attributes}
              {...listeners}
            />
          ) : null}
          <div className={styles.cellContentContainer}>
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
          </div>
          {isLeafHeader && (
            <div
              style={{
                paddingLeft: header.column.getIsSorted()
                  ? "calc(var(--spacing) / 2)"
                  : 0,
              }}
            >
              {{
                asc: <IconArrowUp height={10} />,
                desc: <IconArrowDown height={10} />,
              }[header.column.getIsSorted() as string] ?? null}
            </div>
          )}
        </div>
        {isLeafHeader && header.column.getCanResize() && (
          <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className={classnames(styles.resizer, {
              [styles.isResizing]: header.column.getIsResizing(),
            })}
          />
        )}
        {settings?.enableColumnDescription && tableState.descriptionVisible && (
          <div
            className={styles.tableHeaderDescription}
            onClick={
              header.column.getCanSort()
                ? header.column.getToggleSortingHandler()
                : undefined
            }
          >
            {(header.column.columnDef as GritColumnDef).description}
          </div>
        )}
      </div>
    </th>
  );
};

export default DraggableTableHeaderColumn;
