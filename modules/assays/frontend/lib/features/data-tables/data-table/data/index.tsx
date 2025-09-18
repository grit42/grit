/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  Filter,
  getIsFilterActive,
  SortingState,
  Table,
  useSetupTableState,
} from "@grit42/table";
import styles from "./dataTableData.module.scss";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToolbar } from "@grit42/core/Toolbar";
import { Link, useNavigate } from "react-router-dom";
import { useTableColumns } from "@grit42/core/utils";
import {
  useDataTableRowColumns,
  useDataTableRows,
} from "../../queries/data_table_rows";
import {
  getFilterParams,
  getSortParams,
  getURLParams,
} from "@grit42/api";
import {
  useHasRoles,
} from "@grit42/core";
import { downloadFile } from "@grit42/client-library/utils";
import {
  Button,
  ButtonGroup,
  ErrorPage,
} from "@grit42/client-library/components";
import FullPerspectiveDialog from "./FullPerspectiveDialog";

interface Props {
  dataTableId: string | number;
}

const getExportFileUrl = (
  path: string,
  filters: Filter[] | undefined,
  sort: SortingState | undefined,
  columns: string[],
) => {
  return `${path}/export?${getURLParams({
    ...getSortParams(sort ?? []),
    ...getFilterParams(filters ?? []),
    columns,
  })}`;
};

interface ClickedCellInfo {
  id: number;
  column: string;
}

export const DataTableData = ({ dataTableId }: Props) => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const canEditDataTable = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);

  const [clickedCell, setClickedCell] = useState<ClickedCellInfo | null>(null);

  const { data: columns } = useDataTableRowColumns({
    data_table_id: dataTableId,
  });

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState(
    `data-table-${dataTableId}`,
    tableColumns,
  );

  const { data: rows, isLoading: isRowsLoading } = useDataTableRows(
    dataTableId,
    tableState.sorting,
    tableState.filters,
    undefined,
    { enabled: dataTableId !== "new" },
  );

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  const exportUrl = useMemo(() => {
    const columnIds = tableState.columnOrder.filter(
      (c) =>
        (tableState.columnVisibility[c] ?? true) &&
        !!tableColumns.find(({ id }) => c === id),
    );

    return getExportFileUrl(
      `/api/grit/assays/data_tables/${dataTableId}/data_table_rows`,
      tableState.filters,
      tableState.sorting,
      columnIds,
    );
  }, [
    tableState.columnOrder,
    tableState.filters,
    tableState.sorting,
    tableState.columnVisibility,
    dataTableId,
    tableColumns,
  ]);

  const assay_data_sheet_columns = useMemo(
    () =>
      tableColumns
        ?.filter(
          (c) => c.meta?.data_table?.source_type === "assay_data_sheet_column",
        )
        .map((c) => c.id),
    [tableColumns],
  );

  useEffect(() => {
    return registerToolbarActions({
      exportItems: [
        {
          id: "EXPORT",
          onClick: async () => downloadFile(exportUrl),
          text: `Export items`,
        },
      ],
    });
  }, [
    registerToolbarActions,
    navigateToNew,
    dataTableId,
    navigate,
    canEditDataTable,
    exportUrl,
  ]);

  if (
    !isRowsLoading &&
    rows?.length == 0 &&
    tableState.filters.every((f) => !getIsFilterActive(f))
  ) {
    return (
      <ErrorPage error="Add entities and columns to see data">
        <ButtonGroup>
          <Link to="../entities/edit">
            <Button>Add entities</Button>
          </Link>
          <Link to="../columns/assay/select">
            <Button>Add columns</Button>
          </Link>
        </ButtonGroup>
      </ErrorPage>
    );
  }

  return (
    <div className={styles.dataTableContainer}>
      <FullPerspectiveDialog
        column={clickedCell?.column}
        id={clickedCell?.id}
        onClose={() => setClickedCell(null)}
        columns={tableColumns}
        dataTableId={dataTableId}
      />
      {dataTableId !== "new" && (
        <Table
          tableState={tableState}
          loading={isRowsLoading}
          data={rows ?? []}
          onCellClick={[
            assay_data_sheet_columns,
            ({ original }, column) =>
              setClickedCell({ id: original.id, column: column.toString() }),
          ]}
        />
      )}
    </div>
  );
};

export default DataTableData;
