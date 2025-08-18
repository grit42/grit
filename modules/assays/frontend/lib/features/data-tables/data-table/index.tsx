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

import { ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  useDataTableRowColumns,
  useDataTableRows,
} from "../queries/vocabulary_items";
import { Route, Routes, useParams } from "react-router-dom";
import Vocabulary from "./Vocabulary";
import { useDataTable, useDataTableFields } from "../queries/data_tables";
import VocabularyTabs from "./VocabularyItems";
import { useHasRoles } from "@grit42/core";
// import VocabularyItem from "./VocabularyItem";
import VocabularyItemsTable from "./VocabularyItemsTable";

const VocabularyPage = () => {
  const { data_table_id } = useParams() as { data_table_id: string };
  const canEditVocabularies = useHasRoles([
    "Administrator",
    "VocabularyAdministrator",
  ]);

  const {
    isLoading: isVocabularyLoading,
    isError: isVocabularyError,
    error: vocabularyError,
  } = useDataTable(data_table_id);
  const {
    isLoading: isVocabularyFieldsLoading,
    isError: isVocabularyFieldsError,
    error: vocabularyFieldsError,
  } = useDataTableFields();
  const {
    isLoading: isItemsLoading,
    isError: isItemsError,
    error: itemsError,
  } = useDataTableRows(data_table_id, undefined, undefined, undefined, {
    enabled: data_table_id !== "new",
  });
  const {
    isLoading: isColumnsLoading,
    isError: isColumnsError,
    error: columnsError,
  } = useDataTableRowColumns({ data_table_id });

  if (
    isItemsLoading ||
    isColumnsLoading ||
    isVocabularyLoading ||
    isVocabularyFieldsLoading
  )
    return <Spinner />;

  if (
    isItemsError ||
    isColumnsError ||
    isVocabularyError ||
    isVocabularyFieldsError
  ) {
    return (
      <ErrorPage
        error={
          itemsError ?? columnsError ?? vocabularyError ?? vocabularyFieldsError
        }
      />
    );
  }

  return (
    <Routes>
      <Route element={<Vocabulary vocabularyId={data_table_id} />}>
        <Route
          index
          element={
            canEditVocabularies ? (
              <VocabularyTabs vocabularyId={data_table_id} />
            ) : (
              <VocabularyItemsTable vocabularyId={data_table_id} />
            )
          }
        />
        {/* <Route path="/:vocabulary_item_id" element={<VocabularyItem />} /> */}
      </Route>
    </Routes>
  );
};

export default VocabularyPage;
