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

import { Button } from "@grit42/client-library/components";
import { createSearchParams, Link, useNavigate } from "react-router-dom";
import {
  DataTableColumnData,
  useAvailableDataTableColumns,
} from "../../queries/data_table_columns";
import { useTableColumns } from "@grit42/core/utils";
import { Table, useSetupTableState } from "@grit42/table";
import {
  AssayDataSheetColumnData,
  useAssayDataSheetColumnColumns,
} from "../../../../queries/assay_data_sheet_columns";
import { EntityPropertyDef } from "@grit42/core";

const getRowId = (data: DataTableColumnData | AssayDataSheetColumnData) =>
  `${data.assay_model_id}-${data.assay_id}-${data.id}`;

const defaultOrder = [
  "assay_model_id__name",
  "assay_data_sheet_definition_id__name",
  "name",
  "description",
  "safe_name",
  "data_type_id__name",
  "unit_id__abbreviation",
  "sort",
  "required",
];

const DataTableColumnSelector = ({
  dataTableId,
}: {
  dataTableId: string | number;
}) => {
  const navigate = useNavigate();

  const { data: dataSheetColumnColumns } = useAssayDataSheetColumnColumns(
    undefined,
    {
      select: (data): EntityPropertyDef[] =>
        (data
          ? [
              {
                display_name: "Assay model",
                name: "assay_model_id__name",
                type: "entity",
                default_hidden: false,
                required: false,
                unique: false,
                entity: {
                  column: "assay_model_id",
                  full_name: "Grit::Assays::AssayModel",
                  name: "AssayModel",
                  path: "grit/assays/assay_models",
                  primary_key: "id",
                  primary_key_type: "integer",
                  display_column: "name",
                  display_column_type: "string",
                },
              },
              ...data,
            ]
          : []
        ).toSorted(
          (a, b) =>
            defaultOrder.indexOf(a.name as string) -
            defaultOrder.indexOf(b.name as string),
        ),
    },
  );

  const availableTableColumns = useTableColumns<AssayDataSheetColumnData>(
    dataSheetColumnColumns,
  );

  const availableTableState = useSetupTableState(
    "data-table-available-columns",
    availableTableColumns,
    {
      saveState: {
        columnSizing: true,
      },
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
    },
  );
  const {
    data: availableDataTableColumns,
    isLoading: isAvailableDataTableColumnsLoading,
    isError: isAvailableDataTableColumnsError,
    error: availableDataTableColumnsError,
  } = useAvailableDataTableColumns(
    dataTableId,
    availableTableState.sorting,
    availableTableState.filters,
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        margin: "auto",
        maxWidth: "100%",
        height: "100%",
        overflow: "auto",
      }}
    >
      <Table<AssayDataSheetColumnData>
        header="Available"
        getRowId={getRowId}
        onRowClick={(row) =>
          navigate(
            {
              pathname: "new",
              search: createSearchParams({
                assay_data_sheet_column_id: row.original.id.toString(),
              }).toString(),
            },
            {
              state: {
                assay_data_sheet_column: row.original,
              },
            },
          )
        }
        headerActions={
          <Link to="..">
            <Button color="primary">Cancel</Button>
          </Link>
        }
        loading={isAvailableDataTableColumnsLoading}
        tableState={availableTableState}
        disableFooter
        data={availableDataTableColumns}
        noDataMessage={
          (isAvailableDataTableColumnsError
            ? availableDataTableColumnsError
            : undefined) ?? "No more columns available"
        }
      />
    </div>
  );
};

export default DataTableColumnSelector;
