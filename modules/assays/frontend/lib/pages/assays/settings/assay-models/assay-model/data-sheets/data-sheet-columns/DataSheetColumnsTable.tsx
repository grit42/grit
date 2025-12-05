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

import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import { useToolbar } from "@grit42/core/Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import styles from "../../../assayModels.module.scss";
import {
  useAssayDataSheetColumnColumns,
  useAssayDataSheetColumns,
} from "../../../../../../../queries/assay_data_sheet_columns";
import { Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";

const DataSheetColumnsTable = ({
  sheetId,
  disableNavigation = false,
}: {
  sheetId: string;
  disableNavigation?: boolean;
}) => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: columns } = useAssayDataSheetColumnColumns();
  const tableColumns = useTableColumns(columns ?? []);

  const tableState = useSetupTableState("sheet-columns", tableColumns, {
    saveState: {
      columnSizing: true,
    },
  });

  const { data, isLoading } = useAssayDataSheetColumns(
    sheetId,
    tableState.sorting,
    tableState.filters,
    undefined,
    { enabled: sheetId !== "new" },
  );

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW_COLUMN",
          icon: <Circle1NewIcon />,
          label: "New column",
          onClick: navigateToNew,
          disabled: sheetId === "new",
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, sheetId]);

  return (
    <>
      {sheetId !== "new" && (
        <Table
          header="Columns"
          tableState={tableState}
          loading={isLoading}
          headerActions={
            <Button disabled={sheetId === "new"} onClick={navigateToNew}>
              New
            </Button>
          }
          className={styles.typesTable}
          data={data ?? []}
          onRowClick={
            disableNavigation
              ? undefined
              : (row) => {
                  queryClient.setQueryData(
                    [
                      "entities",
                      "datum",
                      "grit/assays/assay_data_sheet_columns",
                      row.original.id.toString(),
                    ],
                    row.original,
                  );
                  navigate(row.original.id.toString());
                }
          }
        />
      )}
    </>
  );
};

export default DataSheetColumnsTable;
