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

import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { Row } from "@grit42/table";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { EntityInfo } from "../types";
import { useEntities } from "../queries";
import { ErrorPage, Spinner } from "@grit42/client-library/components";

const COLUMNS: GritColumnDef<EntityInfo>[] = [
  {
    accessorKey: "name",
    header: "Name",
    id: "name",
    type: "text",
    description: "The full name of the entity",
    size: 300,
  },
  {
    accessorKey: "path",
    header: "Path",
    id: "path",
    type: "text",
    description: "The path of the entity's controller",
    size: 300,
  },
];

const EntitiesPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useEntities();

  const onRowClick = useCallback(
    (row: Row<EntityInfo>) => navigate(`/core/entities/${row.original.full_name}`),
    [navigate],
  );

  const tableState = useSetupTableState<EntityInfo>("entities-list", COLUMNS, {
    saveState: true,
    settings: {
      clientSideSortAndFilter: true,
      enableColumnDescription: true,
      enableColumnOrderReset: true,
      disableVisibilitySettings: true,
    },
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return (
    <Table<EntityInfo>
      header="Entities"
      data={data}
      tableState={tableState}
      onRowClick={onRowClick}
    />
  );
};

export default EntitiesPage;
