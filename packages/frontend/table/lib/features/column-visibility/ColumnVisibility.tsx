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

import styles from "./columnVisibility.module.scss";
import { ColumnOrderState } from "../../index";
import { useCallback, useMemo, useState } from "react";
import { classnames } from "@grit42/client-library/utils";
import useInternalTableState from "../table-state/useInternalTableState";
import PreviewIcon from "@grit42/client-library/icons/Preview";
import NoPreviewIcon from "@grit42/client-library/icons/NoPreview";
import { Button, Input, Popover } from "@grit42/client-library/components";
import { GritColumnDef, GritGroupColumnDef } from "../../types";
import { getLeafColumnsWithGroupLabels } from "../../utils";

const updateColumnOrderOnToggle = false;

interface ControlProps<T> {
  column: GritColumnDef<T, any>;
  searchValue: string;
}

const columnSearch = (column: GritColumnDef<any, any>, searchValue: string) => {
  return column.header
    ?.toString()
    .toLowerCase()
    .includes(searchValue.toLowerCase());
};

const ColumnVisibilityControl = <T,>({
  column,
  searchValue,
}: ControlProps<T>) => {
  const { columnVisibility, setColumnVisibility, setColumnOrder } =
    useInternalTableState<T>();

  const shown = columnVisibility[column.id!] ?? true;

  const toggleColumn = useCallback(() => {
    const columnId = column.id as keyof T;

    if (updateColumnOrderOnToggle) {
      setColumnOrder((order) => {
        return [
          ...order.filter((x) => x != columnId),
          columnId,
        ] as ColumnOrderState;
      });
    }

    setColumnVisibility((columns: typeof columnVisibility) => {
      return {
        ...columns,
        [columnId]: !shown,
      } as typeof columnVisibility;
    });
  }, [column, shown, setColumnVisibility, setColumnOrder]);

  if (
    column.enableGrouping &&
    (column as GritGroupColumnDef<T, unknown>).columns
  ) {
    if (
      (column as GritGroupColumnDef<T, unknown>).columns!.filter((x) =>
        columnSearch(x, searchValue),
      ).length <= 0
    ) {
      return null;
    }

    return (
      <div key={column.id} style={{ marginBlock: "1em" }}>
        <div className={styles.columnGroup}>
          <h4>{column.header as string}</h4>
        </div>

        <div className={styles.groupColumnList} style={{ paddingLeft: ".5em" }}>
          {(column as GritGroupColumnDef<T>).columns!.map((subColumn) => {
            if (!columnSearch(subColumn, searchValue)) {
              return null;
            }

            return (
              <ColumnVisibilityControl
                key={subColumn.id}
                column={subColumn}
                searchValue={searchValue}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (!columnSearch(column, searchValue)) {
    return null;
  }

  return (
    <div
      className={classnames(styles.columnControl, {
        [styles.hidden as string]: !shown,
      })}
      onClick={toggleColumn}
    >
      <span>{column.header?.toString()}</span>
      {shown ? (
        <PreviewIcon className={styles.columnToggleIcon} height={14} />
      ) : (
        <NoPreviewIcon height={14} className={styles.columnToggleIcon} />
      )}
    </div>
  );
};

const ColumnVisibility = () => {
  const { columns, columnOrder, columnVisibility, setColumnVisibility } =
    useInternalTableState();
  const [columnSearchValue, setColumnSearchValue] = useState("");

  const hiddenColumns = useMemo(
    () => Object.values(columnVisibility).filter((x) => x === false),
    [columnVisibility],
  );

  const flatColumns = useMemo(() => getLeafColumnsWithGroupLabels(columns), [columns])

  const popoverContent = (
    <div className={classnames(styles.columnPopover)}>
      <Input
        className={styles.columnSearchInput}
        value={columnSearchValue}
        onChange={(e) => setColumnSearchValue(e.target.value)}
        type="text"
        placeholder="Search for a column..."
      />

      <div className={styles.columnList}>
        {[...flatColumns]
          .sort((a, b) => {
            const indexA = columnOrder.indexOf(a.id as string);
            const indexB = columnOrder.indexOf(b.id as string);

            if (indexA < indexB) return -1;
            if (indexA > indexB) return 1;

            return 0;
          })
          .map((column) => {
            if (!column.id) return null;

            return (
              <ColumnVisibilityControl
                key={column.id}
                column={column}
                searchValue={columnSearchValue}
              />
            );
          })}
      </div>

      <div className={styles.toggleAll}>
        <Button
          disabled={flatColumns.length <= hiddenColumns.length}
          variant="filled"
          color="primary"
          style={{ height: "2em", flex: 1 }}
          onClick={() => {
            setColumnVisibility((columns: typeof columnVisibility) => {
              return Object.fromEntries(
                Object.keys(columns).map((key) => [key, false]),
              );
            });
          }}
        >
          Hide all
        </Button>

        <Button
          disabled={hiddenColumns.length <= 0}
          variant="filled"
          color="primary"
          style={{ height: "2em", flex: 1 }}
          onClick={() => {
            setColumnVisibility((columns: typeof columnVisibility) => {
              return Object.fromEntries(
                Object.keys(columns).map((key) => [key, true]),
              );
            });
          }}
        >
          Show all
        </Button>
      </div>
    </div>
  );

  return (
    <div className={styles.columnSettings}>
      <Popover content={popoverContent} placement="bottom-start">
        <Button icon={<PreviewIcon height={14} />} color="primary">
          Columns
        </Button>
      </Popover>
    </div>
  );
};

export default ColumnVisibility;
