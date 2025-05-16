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

import { ReactNode, useMemo } from "react";
import styles from "./table.module.scss";
import { Table } from "@tanstack/react-table";
import MenuIcon from "@grit42/client-library/icons/Menu";
import PreviewIcon from "@grit42/client-library/icons/Preview";
import NoPreviewIcon from "@grit42/client-library/icons/NoPreview";
import FilterDeleteIcon from "@grit42/client-library/icons/FilterDelete";
import {
  ButtonGroup,
  Dropdown,
  MenuItems,
} from "@grit42/client-library/components";
import { GritColumnDef, GritTableState, TableStateSettings } from "../types";
import useInternalTableState from "../features/table-state/useInternalTableState";
import { ColumnVisibility } from "../features/column-visibility";
import Filters from "../features/filters/Filters";
import { classnames } from "@grit42/client-library/utils";

interface Props<T> {
  settings?: TableStateSettings<T>;
  table: Table<T>;
  title?: string;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
}

const TableHeader = <T,>({
  title,
  settings,
  table,
  leftActions,
  rightActions,
}: Props<T>) => {
  const {
    filters,
    setFilters,
    columnOrder,
    descriptionVisible,
    setDescriptionVisibility,
    setColumnOrder,
    columns,
    columnVisibility,
  } = useInternalTableState<GritTableState<T>>();

  const tableMenuItems = useMemo(() => {
    const menuItems: MenuItems = [];
    if (settings?.enableColumnDescription) {
      menuItems.push({
        id: "description-visibility",
        text: `${descriptionVisible ? "Hide" : "Show"} column description`,
        icon: descriptionVisible ? (
          <NoPreviewIcon height={14} />
        ) : (
          <PreviewIcon height={14} />
        ),
        onClick: () => setDescriptionVisibility(!descriptionVisible),
      });
    }
    if (settings?.enableColumnOrderReset) {
      menuItems.push({
        id: "column-order-reset",
        text: "Reset column order",
        icon: <FilterDeleteIcon height={14} />,
        onClick: () => setColumnOrder([]),
      });
    }
    return menuItems.length ? menuItems : undefined;
  }, [settings, setColumnOrder, descriptionVisible, setDescriptionVisibility]);

  return (
    <div className={styles.header}>
      <div className={styles.title}>{title}</div>
      <div
        className={classnames(styles.leftActions, {
          [styles.withTitle]: !!title,
        })}
      >
        {leftActions}
      </div>
      <div className={styles.rightActions}>
        <ButtonGroup>
          {rightActions}
          {(!settings?.disableFilters ||
            !settings?.disableVisibilitySettings) && (
            <>
              {!settings?.disableFilters && (
                <div className={styles.filterWrapper}>
                  <Filters
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
                    filters={filters}
                    setFilters={setFilters}
                    onChange={() => table.setRowSelection({})}
                  />
                </div>
              )}
              {!settings?.disableVisibilitySettings && <ColumnVisibility />}
            </>
          )}
        </ButtonGroup>
        {tableMenuItems && (
          <div className={styles.tableMenuTrigger}>
            <Dropdown menuItems={tableMenuItems}>
              <MenuIcon />
            </Dropdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableHeader;
