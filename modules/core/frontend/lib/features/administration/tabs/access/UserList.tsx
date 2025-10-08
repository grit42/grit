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
import { useEffect } from "react";
import Circle1New from "@grit42/client-library/icons/Circle1New";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { useToolbar } from "../../../../Toolbar";
import { EntityData, useEntityData } from "../../../entities";
import { ErrorPage } from "@grit42/client-library/components";

const USER_TABLE_COLUMNS: GritColumnDef<EntityData>[] = [
  {
    accessorKey: "login",
    header: "Login",
    id: "login",
    type: "string",
  },
  {
    accessorKey: "name",
    header: "Name",
    id: "name",
    type: "string",
  },
  {
    accessorKey: "email",
    header: "Email",
    id: "email",
    type: "string",
  },
  {
    accessorKey: "origin_id__name",
    header: "Origin",
    id: "origin_id__name",
    type: "entity",
    meta: {
      entity: {
        full_name: "Grit::Core::Origin",
        name: "Origin",
        path: "grit/core/origins",
        column: "origin_id",
        display_column: "name",
        display_column_type: "string",
        primary_key: "id",
        primary_key_type: "integer",
      },
    },
  },
  {
    accessorKey: "active",
    header: "Active",
    id: "active",
    type: "boolean",
  },
];

export default function UsersList() {
  const navigate = useNavigate();
  const registerToolbarActions = useToolbar();
  const tableState = useSetupTableState<EntityData>(
    "admin-users",
    USER_TABLE_COLUMNS,
    {
      saveState: true,
      settings: {
        disableColumnReorder: true,
        disableColumnSizing: true,
        disableColumnSorting: true,
      },
    },
  );

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW_USER",
          icon: <Circle1New />,
          label: "New",
          onClick: () => navigate("new"),
          requiredRoles: ["Administrator"],
        },
      ],
    });
  }, [navigate, registerToolbarActions]);

  const { data, isLoading, isError, error } = useEntityData(
    "grit/core/users",
    tableState.sorting,
    tableState.filters,
  );

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <Table<EntityData>
      header="Users"
      tableState={tableState}
      data={data}
      loading={isLoading}
      onRowClick={(row) => navigate(row.original.id.toString())}
    />
  );
}
