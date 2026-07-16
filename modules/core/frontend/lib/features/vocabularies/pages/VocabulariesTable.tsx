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

import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { useCallback, useEffect, useMemo } from "react";
import { useToolbar } from "../../toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, ErrorPage } from "@grit42/client-library/components";
import {
  useInfiniteVocabularies,
  VocabularyData,
} from "../queries/vocabularies";
import styles from "./vocabularies.module.scss";
import { useHasPermission } from "../../auth";

const COLUMNS: GritColumnDef<VocabularyData>[] = [
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
    size: 250,
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    type: "text",
    size: 750,
  },
];


const VocabulariesTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const canEditVocabularies = useHasPermission("admin:vocabularies");
  const { pathname } = useLocation();

  const tableState = useSetupTableState(
    "vocabularies-tables",
    COLUMNS,
    {
      settings: {
        disableColumnReorder: true,
      },
      initial: {
        sorting: [
          {
            id: "name",
            desc: false,
          },
        ],
        sizing: {
          name: 500,
          description: 750,
        },
      },
    },
  );

  const { data, isLoading, isFetchingNextPage, isError, error, fetchNextPage } =
    useInfiniteVocabularies(tableState.sorting, tableState.filters);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New vocabulary",
          onClick: navigateToNew,
          disabled: !canEditVocabularies,
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, pathname, canEditVocabularies]);

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <div className={styles.vocabularies}>
      <Table
        tableState={tableState}
        header="Vocabularies"
        headerActions={
          canEditVocabularies ? (
            <Link to="new">
              <Button color="secondary">New</Button>
            </Link>
          ) : undefined
        }
        className={styles.typesTable}
        data={flatData}
        onRowClick={(row) => navigate(`${row.original.id}/items`)}
        loading={isLoading}
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0]?.total,
        }}
      />
    </div>
  );
};

export default VocabulariesTable;
