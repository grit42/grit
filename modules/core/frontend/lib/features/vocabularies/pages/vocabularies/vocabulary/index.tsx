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
import { useVocabularyItemColumns } from "../../../queries/vocabulary_items";
import { Route, Routes, useParams } from "react-router-dom";
import Vocabulary from "./Vocabulary";
import {
  useVocabulary,
  useVocabularyFields,
} from "../../../queries/vocabularies";
import { AuthGuard, useHasPermission } from "../../../../auth";
import VocabularyItem from "./VocabularyItem";
import { useBreadcrumbs, useTabs } from "../../../../../app";
import { useMemo } from "react";
import VocabularyLoadSets from "./VocabularyLoadSets";
import VocabularySettings from "./VocabularySettings";
import { VOCABULARY_BREADCRUMBS } from "./breadcrumbs";

const VocabularyPage = () => {
  const { vocabulary_id } = useParams() as { vocabulary_id: string };

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

  useBreadcrumbs(
    useMemo(() => VOCABULARY_BREADCRUMBS(vocabulary), [vocabulary]),
  );

  const canAdmin = useHasPermission("admin:vocabularies");

  useTabs(
    useMemo(
      () => canAdmin ? [
        { label: "Items", url: `/core/vocabularies/${vocabulary_id}/items` },
        {
          label: "Load sets",
          url: `/core/vocabularies/${vocabulary_id}/load-sets`,
        },
        {
          label: "Settings",
          url: `/core/vocabularies/${vocabulary_id}/settings`,
        },
      ] : [],
      [canAdmin, vocabulary_id],
    ),
  );

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
      <Route path="items">
        <Route index element={<Vocabulary vocabularyId={vocabulary_id} />} />
        <Route path=":vocabulary_item_id" element={<VocabularyItem />} />
      </Route>
      <Route
        path="load-sets"
        element={
          <AuthGuard permission="admin:vocabularies">
            <VocabularyLoadSets vocabularyId={vocabulary_id} />
          </AuthGuard>
        }
      />
      <Route
        path="settings"
        element={
          <AuthGuard permission="admin:vocabularies">
            <VocabularySettings vocabularyId={vocabulary_id} />
          </AuthGuard>
        }
      />
    </Routes>
  );
};

export default VocabularyPage;
