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
import { useCallback, useEffect } from "react";
import { useToolbar } from "@grit42/core/Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useTableColumns } from "@grit42/core/utils";
import styles from "./assayTypes.module.scss";
import {
  useAssayTypeColumns,
  useAssayTypes,
} from "../../../../queries/assay_types";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const AssayTypesTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: assayTypes } = useAssayTypes();
  const { data: assayTypeColumns } = useAssayTypeColumns(undefined, {
    select: (data) =>
      data.map((d) => ({
        ...d,
        defaultColumnSize:
          DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
      })),
  });

  const tableColumns = useTableColumns(assayTypeColumns);

  const navigateToNew = useCallback(
    () => navigate("new"),
    [navigate],
  );

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New assay type",
          onClick: navigateToNew,
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, pathname]);

  const tableState = useSetupTableState(
    "admin-assay_types-list",
    tableColumns,
  );

  return (
      <Table
        header="Assay types"
        tableState={tableState}
        headerActions={<Button onClick={navigateToNew}>New</Button>}
        className={styles.typesTable}
        data={assayTypes}
        onRowClick={(row) => navigate(`${row.original.id}`)}
      />
  );
};

const AssayTypesTableWrapper = () => {
    const {
      isLoading: isAssayTypeColumnsLoading,
      isError: isAssayTypeColumnsError,
      error: assayTypeColumnsError,
    } = useAssayTypeColumns();

    const { isLoading, isError, error } = useAssayTypes();

    if (isAssayTypeColumnsLoading || isLoading)
      return <Spinner />;
    if (isAssayTypeColumnsError || isError)
      return <ErrorPage error={assayTypeColumnsError ?? error} />;
  return <AssayTypesTable />
}

export default AssayTypesTableWrapper;
