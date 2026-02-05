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

import { Table, useSetupTableState } from "@grit42/table";
import { useCallback, useEffect, useMemo } from "react";
import { useToolbar } from "@grit42/core/Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useNavigate } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useTableColumns } from "@grit42/core/utils";
import styles from "./assayMetadataDefinitions.module.scss";
import {
  useAssayMetadataDefinitionColumns,
  useInfiniteAssayMetadataDefinitions,
} from "../../../../queries/assay_metadata_definitions";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const AssayMetadataDefinitionsTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const { data: assayMetadataDefinitionColumns } =
    useAssayMetadataDefinitionColumns(undefined, {
      select: (data) =>
        data.map((d) => ({
          ...d,
          defaultColumnSize:
            DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
        })),
    });

  const tableColumns = useTableColumns(assayMetadataDefinitionColumns);

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

  const tableState = useSetupTableState(
    "admin-assay_metadata_definitions-list",
    tableColumns,
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
      header="Assay metadata"
      tableState={tableState}
      headerActions={<Button onClick={navigateToNew}>New</Button>}
      className={styles.table}
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

const AssayMetadataDefinitionsTableWrapper = () => {
  const {
    isLoading: isAssayMetadataDefinitionColumnsLoading,
    isError: isAssayMetadataDefinitionColumnsError,
    error: assayMetadataDefinitionColumnsError,
  } = useAssayMetadataDefinitionColumns();

  if (isAssayMetadataDefinitionColumnsLoading) return <Spinner />;
  if (isAssayMetadataDefinitionColumnsError)
    return <ErrorPage error={assayMetadataDefinitionColumnsError} />;
  return <AssayMetadataDefinitionsTable />;
};

export default AssayMetadataDefinitionsTableWrapper;
