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

import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import {
  AssayModelData,
  useInfiniteAssayModels,
} from "../../../queries/assay_models";

const COLUMNS: GritColumnDef<AssayModelData>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "Id",
    type: "integer",
    defaultVisibility: "hidden",
  },
  {
    id: "created_by",
    accessorKey: "created_by",
    header: "Created by",
    type: "string",
    defaultVisibility: "hidden",
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    header: "Created at",
    type: "datetime",
    defaultVisibility: "hidden",
  },
  {
    id: "updated_by",
    accessorKey: "updated_by",
    header: "Updated by",
    type: "string",
    defaultVisibility: "hidden",
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    header: "Updated at",
    type: "datetime",
    defaultVisibility: "hidden",
  },
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    type: "string",
    size: 200,
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    type: "text",
    size: 750,
  },
  {
    id: "assay_type_id__name",
    accessorKey: "assay_type_id__name",
    header: "Assay type",
    type: "entity",
    entity: {
      full_name: "Grit::Assays::AssayType",
      name: "AssayType",
      path: "grit/assays/assay_types",
      primary_key: "id",
      primary_key_type: "integer",
      column: "assay_type_id",
      display_column: "name",
      display_column_type: "string",
    },
  } as GritColumnDef<AssayModelData>,
  {
    id: "publication_status_id__name",
    accessorKey: "publication_status_id__name",
    header: "Publication status",
    type: "entity",
    entity: {
      full_name: "Grit::Core::PublicationStatus",
      name: "PublicationStatus",
      path: "grit/core/publication_statuses",
      primary_key: "id",
      primary_key_type: "integer",
      column: "publication_status_id",
      display_column: "name",
      display_column_type: "string",
    },
  } as GritColumnDef<AssayModelData>,
];

const AssayModelsTable = () => {
  const navigate = useNavigate();

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  const tableState = useSetupTableState("admin-assay_models-list", COLUMNS);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteAssayModels(tableState.sorting, tableState.filters);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table
      header="Assay models"
      tableState={tableState}
      headerActions={
        <Button color="secondary" onClick={navigateToNew}>
          New
        </Button>
      }
      data={flatData}
      onRowClick={(row) => navigate(`${row.original.id}/details`)}
      loading={isFetching}
      noDataMessage={isError ? error : undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

export default AssayModelsTable;
