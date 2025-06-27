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

import { Filter, SortingState, Table, useSetupTableState } from "@grit42/table";
import styles from "./vocabulary.module.scss";
import { useCallback, useEffect, useMemo } from "react";
import { useToolbar } from "../../../Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import { useTableColumns } from "../../../utils";
import {
  useVocabularyItemColumns,
  useVocabularyItems,
} from "../queries/vocabulary_items";
import { useDestroyEntityMutation } from "../../entities";
import {
  getFilterParams,
  getSortParams,
  getURLParams,
  useQueryClient,
} from "@grit42/api";
import { useHasRoles } from "../../session";
import { downloadFile } from "@grit42/client-library/utils";

interface Props {
  vocabularyId: string | number;
}

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

export const VocabularyItemsTable = ({ vocabularyId }: Props) => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canEditVocabularies = useHasRoles(["Administrator", "VocabularyAdministrator"])

  const { data: columns } = useVocabularyItemColumns();

  const destroyItemsMutation = useDestroyEntityMutation(
    "grit/core/vocabulary_items",
  );

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("vocabulary-items", tableColumns, {
    settings: {
      enableSelection: true,
      disableVisibilitySettings: true,
    },
    saveState: {
      filters: false,
    },
  });

  const { data: vocabularyItems, isLoading: isVocabularyItemsLoading } =
    useVocabularyItems(
      vocabularyId,
      tableState.sorting,
      tableState.filters,
      undefined,
      { enabled: vocabularyId !== "new" },
    );

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  const exportUrl = useMemo(() => {
    const columnIds = tableState.columnOrder.filter(
      (c) =>
        (tableState.columnVisibility[c] ?? true) &&
        !!tableColumns.find(({ id }) => c === id),
    );

    return getExportFileUrl(
      `/api/grit/core/vocabularies/${vocabularyId}/vocabulary_items`,
      tableState.filters,
      tableState.sorting,
      columnIds,
    );
  }, [
    tableState.columnOrder,
    tableState.filters,
    tableState.sorting,
    tableState.columnVisibility,
    vocabularyId,
    tableColumns,
  ]);

  useEffect(() => {
    return registerToolbarActions({
      actions: canEditVocabularies
        ? [
            {
              id: "NEW",
              icon: <Circle1NewIcon />,
              label: "New item",
              onClick: navigateToNew,
              disabled: vocabularyId === "new",
            },
          ]
        : undefined,
      importItems: canEditVocabularies
        ? [
            {
              id: "IMPORT ITEMS",
              text: "Import items",
              onClick: () =>
                navigate(
                  `/core/load_sets/new?entity=Grit::Core::VocabularyItem&vocabulary_id=${vocabularyId}`,
                ),
              disabled: vocabularyId === "new",
            },
          ]
        : undefined,
      exportItems: [
        {
          id: "EXPORT",
          onClick: async () => downloadFile(exportUrl),
          text: `Export items`,
        },
      ],
    });
  }, [
    registerToolbarActions,
    navigateToNew,
    vocabularyId,
    navigate,
    canEditVocabularies,
    exportUrl,
  ]);

  return (
    <>
      {vocabularyId !== "new" && (
        <Table
          tableState={tableState}
          header={canEditVocabularies ? undefined : "Items"}
          loading={isVocabularyItemsLoading}
          headerActions={
            canEditVocabularies ? (
              <Button disabled={vocabularyId === "new"} onClick={navigateToNew}>
                New
              </Button>
            ) : undefined
          }
          rowActions={canEditVocabularies ? ["delete"] : undefined}
          onDelete={async (rows) => {
            if (
              !window.confirm(
                `Are you sure you want to delete ${
                  rows.length > 1 ? `${rows.length} items` : "this item"
                }? This action is irreversible`,
              )
            )
              return;
            await destroyItemsMutation.mutateAsync(
              rows.map(({ original }) => original.id),
            );
            await queryClient.invalidateQueries({
              queryKey: [
                "entityData",
                "grit/core/vocabulary_items",
                vocabularyId.toString(),
              ],
            });
          }}
          className={styles.typesTable}
          data={vocabularyItems ?? []}
          onRowClick={
            canEditVocabularies
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
        />
      )}
    </>
  );
};

export default VocabularyItemsTable;
