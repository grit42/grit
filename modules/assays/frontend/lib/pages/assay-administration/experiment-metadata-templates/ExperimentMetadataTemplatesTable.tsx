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
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import {
  ExperimentMetadataTemplateData,
  useInfiniteExperimentMetadataTemplates,
} from "../../../queries/experiment_metadata_templates";

const COLUMNS: GritColumnDef<ExperimentMetadataTemplateData>[] = [
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
];

const ExperimentMetadataTemplatesTable = () => {
  const navigate = useNavigate();

  const tableState = useSetupTableState<ExperimentMetadataTemplateData>(
    "admin-experiment_metadata_templates-list",
    COLUMNS,
  );

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteExperimentMetadataTemplates(
    tableState.sorting,
    tableState.filters,
  );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table<ExperimentMetadataTemplateData>
      header="Metadata Templates"
      tableState={tableState}
      headerActions={<Button onClick={() => navigate("new")}>New</Button>}
      onRowClick={(row) => navigate(`${row.original.id}`)}
      data={flatData}
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

export default ExperimentMetadataTemplatesTable;
