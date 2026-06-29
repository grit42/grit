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

import { Table } from "@tanstack/react-table";
import { Filters } from "../features/filters";
import useInternalTableState from "../../features/table-state/useInternalTableState";
import { GritColumnDef, GritTableState } from "../../types";
import styles from "./table.module.scss";
import MenuIcon from "@grit42/client-library/icons/Menu";
import { Button } from "@grit42/client-library/components";

const TableFooter = <T,>({
  loadedRecords,
  totalRecords,
  table,
  showFilters,
  setShowFilters,
  setShowSettings,
  actions = null,
}: {
  loadedRecords?: number;
  totalRecords?: number;
  table: Table<T>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  actions?: React.ReactNode;
}) => {
  const { filters, setFilters, columnOrder, columns, columnVisibility } =
    useInternalTableState<GritTableState<T>>();

  let message = "";
  if (
    totalRecords !== undefined &&
    loadedRecords !== undefined &&
    totalRecords !== loadedRecords
  ) {
    message = `Showing ${loadedRecords} out of ${totalRecords} records`;
  } else if (loadedRecords !== undefined) {
    message = `${loadedRecords} records`;
  }
  return (
    <div className={styles.footer}>
      {!showFilters && (
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
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          onChange={() => table.setRowSelection({})}
        />
      )}
      <div className={styles.spacer} />
      {actions}
      <span>{message}</span>
      <Button
        size="tiny"
        style={{ padding: "var(--spacing-sm)", height: 24 }}
        icon={<MenuIcon height={16} />}
        color="primary"
        onClick={() => setShowSettings((prev) => !prev)}
      />
    </div>
  );
};

export default TableFooter;
