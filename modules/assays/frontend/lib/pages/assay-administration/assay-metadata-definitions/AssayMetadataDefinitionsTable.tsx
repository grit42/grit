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
import { useCallback, useEffect, useMemo } from "react";
import { useToolbar } from "@grit42/core";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import {
  AssayMetadataDefinitionData,
  useInfiniteAssayMetadataDefinitions,
} from "../../../queries/assay_metadata_definitions";

const COLUMNS: GritColumnDef<AssayMetadataDefinitionData>[] = [
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
    id: "safe_name",
    accessorKey: "safe_name",
    header: "Safe name",
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
    id: "vocabulary_id__name",
    accessorKey: "vocabulary_id__name",
    header: "Vocabulary",
    type: "entity",
    entity: {
      full_name: "Grit::Core::Vocabulary",
      name: "Vocabulary",
      path: "grit/core/vocabularies",
      primary_key: "id",
      primary_key_type: "integer",
      column: "vocabulary_id",
      display_column: "name",
      display_column_type: "string",
    },
  } as GritColumnDef<AssayMetadataDefinitionData>,
];

const AssayMetadataDefinitionsTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New assay metadata",
          onClick: navigateToNew,
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew]);

  const tableState = useSetupTableState<AssayMetadataDefinitionData>(
    "admin-assay_metadata_definitions-list",
    COLUMNS,
  );

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteAssayMetadataDefinitions(
    tableState.sorting,
    tableState.filters,
  );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table
      header="Metadata definitions"
      tableState={tableState}
      headerActions={<Button onClick={navigateToNew}>New</Button>}
      data={flatData}
      onRowClick={(row) => navigate(`${row.original.id}`)}
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

export default AssayMetadataDefinitionsTable;
