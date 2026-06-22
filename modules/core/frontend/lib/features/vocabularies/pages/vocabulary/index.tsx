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
import { Outlet, Route, Routes, useParams } from "react-router-dom";
import Vocabulary from "./Vocabulary";
import { useVocabulary, useVocabularyFields } from "../../queries/vocabularies";
import { AuthGuard, useHasPermission } from "../../../auth";
import VocabularyItem from "./VocabularyItem";
import {
  useBreadcrumbs,
  useTabs,
} from "../../../../app/shell/AppShell/AppShellContext";
import { useEffect } from "react";
import VocabularyLoadSets from "./VocabularyLoadSets";
import VocabularySettings from "./VocabularySettings";

const Test = ({ vocabularyId }: { vocabularyId: string | number }) => {
  const { register } = useTabs();
  const canAdmin = useHasPermission("admin:vocabularies");

  useEffect(() => {
    if (!canAdmin) return;
    return register([
      { label: "Items", url: `/core/vocabularies/${vocabularyId}/items` },
      {
        label: "Load sets",
        url: `/core/vocabularies/${vocabularyId}/load-sets`,
      },
      {
        label: "Settings",
        url: `/core/vocabularies/${vocabularyId}/settings`,
      },
    ]);
  }, [canAdmin, register, vocabularyId]);

  return <Outlet />;
};

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

  const { register: registerBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    if (!vocabulary) return;
    return registerBreadcrumbs([
      {
        label: vocabulary.name,
        url: `/core/vocabularies/${vocabulary.id}/items`,
      },
    ]);
  }, [registerBreadcrumbs, vocabulary]);
  const { register: registerTabs } = useTabs();
  const canAdmin = useHasPermission("admin:vocabularies");

  useEffect(() => {
    if (!canAdmin) return;
    return registerTabs([
      { label: "Items", url: `/core/vocabularies/${vocabulary_id}/items` },
      {
        label: "Load sets",
        url: `/core/vocabularies/${vocabulary_id}/load-sets`,
      },
      {
        label: "Settings",
        url: `/core/vocabularies/${vocabulary_id}/settings`,
      },
    ]);
  }, [canAdmin, registerTabs, vocabulary_id]);

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
        <Route
          path="items"
          element={<Vocabulary vocabularyId={vocabulary_id} />}
        >
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
