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

import {
  Filter,
  GritColumnDef,
  SortingState,
  Table,
  useSetupTableState,
} from "@grit42/table";
import styles from "./vocabulary.module.scss";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, ErrorPage } from "@grit42/client-library/components";
import {
  useInfiniteVocabularyItems,
  VocabularyItemData,
} from "../../queries/vocabulary_items";
import {
  getFilterParams,
  getSortParams,
  getURLParams,
  useQueryClient,
} from "@grit42/api";
import { downloadFile } from "@grit42/client-library/utils";
import { useVocabularyContext } from "./vocabularyContext";

const COLUMNS: GritColumnDef<VocabularyItemData>[] = [
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
  {
    id: "vocabulary_id__name",
    accessorKey: "vocabulary_id__name",
    header: "Vocabulary",
    type: "entity",
    defaultVisibility: "hidden",
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
  } as GritColumnDef<VocabularyItemData>,
];

const getExportFileUrl = (
  path: string,
  filters: Filter[] | undefined,
  sort: SortingState | undefined,
  columns: string[],
) => {
  return `${path}/export?${getURLParams({
    ...getSortParams(sort ?? []),
    ...getFilterParams(filters ?? []),
    columns,
  })}`;
};

const VocabularyItemsTable = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { vocabulary, canAdmin } = useVocabularyContext();

  const tableState = useSetupTableState(
    `vocabulary-items-${vocabulary.id}`,
    COLUMNS,
  );

  const { data, isLoading, isFetchingNextPage, isError, error, fetchNextPage } =
    useInfiniteVocabularyItems(
      vocabulary.id,
      tableState.sorting,
      tableState.filters,
      undefined,
    );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  const exportUrl = useMemo(() => {
    const columnIds = tableState.columnOrder.filter(
      (c) =>
        (tableState.columnVisibility[c] ?? true) &&
        !!COLUMNS.find(({ id }) => c === id),
    );

    return getExportFileUrl(
      `/api/grit/core/vocabularies/${vocabulary.id}/vocabulary_items`,
      tableState.filters,
      tableState.sorting,
      columnIds,
    );
  }, [
    tableState.columnOrder,
    tableState.filters,
    tableState.sorting,
    tableState.columnVisibility,
    vocabulary.id,
  ]);

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <Table
      headerActions={
        <>
          {canAdmin && (
            <Link
              to={`/core/load_sets/new?entity=Grit::Core::VocabularyItem&vocabulary_id=${vocabulary.id}`}
            >
              <Button>Import</Button>
            </Link>
          )}
          <Button onClick={() => downloadFile(exportUrl)}>Export</Button>
        </>
      }
      tableState={tableState}
      loading={isLoading}
      header="Items"
      className={styles.typesTable}
      data={flatData}
      onRowClick={
        canAdmin
          ? (row) => {
              queryClient.setQueryData(
                [
                  "entities",
                  "datum",
                  "grit/core/vocabulary_items",
                  row.original.id.toString(),
                ],
                row.original,
              );
              navigate(row.original.id.toString());
            }
          : undefined
      }
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

export default VocabularyItemsTable;
