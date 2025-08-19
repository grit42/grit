/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { Filter, SortingState, Table, useSetupTableState } from "@grit42/table";
import styles from "./dataTable.module.scss";
import { useCallback, useEffect, useMemo } from "react";
import { useToolbar } from "@grit42/core/Toolbar";
import { useNavigate } from "react-router-dom";
import { useTableColumns } from "@grit42/core/utils";
import {
  useDataTableRowColumns,
  useDataTableRows,
} from "../queries/data_table_rows";
import {
  getFilterParams,
  getSortParams,
  getURLParams,
} from "@grit42/api";
import { useHasRoles } from "@grit42/core";
import { downloadFile } from "@grit42/client-library/utils";

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

export const DataTableRowsTable = ({ dataTableId }: Props) => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const canEditDataTable = useHasRoles(["Administrator", "AssayAdministrator", "AssayUser"])

  const { data: columns } = useDataTableRowColumns({data_table_id: dataTableId});

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState(`data-table-${dataTableId}`, tableColumns);

  const { data: rows, isLoading: isRowsLoading } =
    useDataTableRows(
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

  useEffect(() => {
    return registerToolbarActions({
      // importItems: canEditDataTable
      //   ? [
      //       {
      //         id: "IMPORT ITEMS",
      //         text: "Import items",
      //         onClick: () =>
      //           navigate(
      //             `/core/load_sets/new?entity=Grit::Core::VocabularyItem&vocabulary_id=${dataTableId}`,
      //           ),
      //         disabled: dataTableId === "new",
      //       },
      //     ]
      //   : undefined,
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

  return (
    <>
      {dataTableId !== "new" && (
        <Table
          tableState={tableState}
          header={canEditDataTable ? undefined : "Items"}
          loading={isRowsLoading}
          // headerActions={
          //   canEditVocabularies ? (
          //     <Button disabled={dataTableId === "new"} onClick={navigateToNew}>
          //       New
          //     </Button>
          //   ) : undefined
          // }
          className={styles.typesTable}
          data={rows ?? []}
        />
      )}
    </>
  );
};

export default DataTableRowsTable;
