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
  useAssayDataSheetColumnColumns,
  useAssayDataSheetColumns,
} from "../../../../queries/assay_data_sheet_columns";
import { Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";

const DataSheetColumnsTable = ({ sheetId }: { sheetId: string }) => {
  const { data: columns } = useAssayDataSheetColumnColumns(undefined, {
    select: (data) =>
      data.filter(
        ({ name }) =>
          !["assay_data_sheet_definition_id__name", "sort"].includes(
            name as string,
          ),
      ),
  });
  const tableColumns = useTableColumns(columns ?? []);

  const tableState = useSetupTableState("sheet-columns", tableColumns, {
    settings: {
      disableVisibilitySettings: true,
    },
    saveState: {
      columnSizing: true,
    },
  });

  const { data, isLoading } = useAssayDataSheetColumns(
    sheetId,
    tableState.sorting,
    tableState.filters,
  );

  return (
    <Table
      header="Columns"
      tableState={tableState}
      loading={isLoading}
      data={data ?? []}
    />
  );
};

export default DataSheetColumnsTable;
