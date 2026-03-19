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

import { Table, useSetupTableState } from "@grit42/table";
import { useCallback, useEffect, useMemo } from "react";
import { useToolbar } from "../../../toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, ErrorPage } from "@grit42/client-library/components";
import { useTableColumns } from "../../../../utils";
import {
  useInfiniteVocabularies,
  useVocabularyColumns,
} from "../../queries/vocabularies";
import styles from "./vocabularies.module.scss";
import { useHasRoles } from "../../../auth";

const VocabulariesTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const canEditVocabularies = useHasRoles([
    "Administrator",
    "VocabularyAdministrator",
  ]);
  const { pathname } = useLocation();
  const { data: vocabularyColumns } = useVocabularyColumns();

  const vocabulariesTableColumns = useTableColumns(vocabularyColumns);

  const tableState = useSetupTableState(
    "vocabularies-tables",
    vocabulariesTableColumns,
    {
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
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
              <Button>New</Button>
            </Link>
          ) : undefined
        }
        className={styles.typesTable}
        data={flatData}
        onRowClick={(row) => navigate(`${row.original.id}`)}
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
