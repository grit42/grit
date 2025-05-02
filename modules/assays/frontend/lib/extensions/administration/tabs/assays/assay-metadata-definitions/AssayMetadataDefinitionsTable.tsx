/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/assays.
 *
 * @grit/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { Table, useSetupTableState } from "@grit/table";
import { useCallback, useEffect } from "react";
import { useToolbar } from "@grit/core/Toolbar";
import Circle1NewIcon from "@grit/client-library/icons/Circle1New";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit/client-library/components";
import { useTableColumns } from "@grit/core/utils";
import styles from "./assayMetadataDefinitions.module.scss";
import {
  useAssayMetadataDefinitionColumns,
  useAssayMetadataDefinitions,
} from "../../../../../queries/assay_metadata_definitions";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const AssayMetadataDefinitionsTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: assayMetadataDefinitions } = useAssayMetadataDefinitions();
  const { data: assayMetadataDefinitionColumns } = useAssayMetadataDefinitionColumns(undefined, {
    select: (data) =>
      data.map((d) => ({
        ...d,
        defaultColumnSize:
          DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
      })),
  });

  const tableColumns = useTableColumns(assayMetadataDefinitionColumns);

  const navigateToNew = useCallback(
    () => navigate("new"),
    [navigate, pathname],
  );

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
  }, [registerToolbarActions, navigateToNew, pathname]);

  const tableState = useSetupTableState(
    "admin-assay_metadata_definitions-list",
    tableColumns,
    {
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
    },
  );

  return (
      <Table
        header="Assay metadata"
        tableState={tableState}
        headerActions={<Button onClick={navigateToNew}>New</Button>}
        className={styles.table}
        data={assayMetadataDefinitions}
        onRowClick={(row) => navigate(`${row.original.id}`)}
      />
  );
};

const AssayMetadataDefinitionsTableWrapper = () => {
    const {
      isLoading: isAssayMetadataDefinitionColumnsLoading,
      isError: isAssayMetadataDefinitionColumnsError,
      error: assayMetadataDefinitionColumnsError,
    } = useAssayMetadataDefinitionColumns();

    const { isLoading, isError, error } = useAssayMetadataDefinitions();

    if (isAssayMetadataDefinitionColumnsLoading || isLoading)
      return <Spinner />;
    if (isAssayMetadataDefinitionColumnsError || isError)
      return <ErrorPage error={assayMetadataDefinitionColumnsError ?? error} />;
  return <AssayMetadataDefinitionsTable />
}

export default AssayMetadataDefinitionsTableWrapper;
