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
import { useVocabularyItemColumns } from "../../queries/vocabulary_items";
import { Route, Routes, useParams } from "react-router-dom";
import Vocabulary from "./Vocabulary";
import { useVocabulary, useVocabularyFields } from "../../queries/vocabularies";
import VocabularyTabs from "./VocabularyItems";
import { useHasPermission } from "../../../auth";
import VocabularyItem from "./VocabularyItem";
import VocabularyItemsTable from "./VocabularyItemsTable";
import { useBreadcrumbs } from "../../../../app/shell/AppShell/AppShellContext";
import { useEffect } from "react";

const VocabularyPage = () => {
  const { vocabulary_id } = useParams() as { vocabulary_id: string };
  const canWrite = useHasPermission("admin:vocabularies");

  const {
    data: vocabulary,
    isLoading: isVocabularyLoading,
    isError: isVocabularyError,
    error: vocabularyError,
  } = useVocabulary(vocabulary_id);
  const {
    isLoading: isVocabularyFieldsLoading,
    isError: isVocabularyFieldsError,
    error: vocabularyFieldsError,
  } = useVocabularyFields();

  const {
    isLoading: isColumnsLoading,
    isError: isColumnsError,
    error: columnsError,
  } = useVocabularyItemColumns();

  const { register } = useBreadcrumbs();
  useEffect(() => {
    if (!vocabulary) return;
    return register([
      { label: vocabulary.name, url: `/core/vocabularies/${vocabulary.id}` },
    ]);
  }, [register, vocabulary]);

  if (isColumnsLoading || isVocabularyLoading || isVocabularyFieldsLoading)
    return <Spinner />;

  if (isColumnsError || isVocabularyError || isVocabularyFieldsError) {
    return (
      <ErrorPage
        error={columnsError ?? vocabularyError ?? vocabularyFieldsError}
      />
    );
  }

  return (
    <Routes>
      <Route element={<Vocabulary vocabularyId={vocabulary_id} />}>
        <Route
          index
          element={
            canWrite ? (
              <VocabularyTabs vocabularyId={vocabulary_id} />
            ) : (
              <VocabularyItemsTable vocabularyId={vocabulary_id} />
            )
          }
        />
        <Route path=":vocabulary_item_id" element={<VocabularyItem />} />
      </Route>
    </Routes>
  );
};

export default VocabularyPage;
