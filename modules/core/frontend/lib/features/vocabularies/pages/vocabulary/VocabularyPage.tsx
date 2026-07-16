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

import { ErrorPage, LoadingPage } from "@grit42/client-library/components";
import { Outlet, useParams } from "react-router-dom";
import { useVocabulary } from "../../queries/vocabularies";
import { useHasPermission } from "../../../auth";
import { useBreadcrumbs, useTabs } from "../../../../app";
import { useMemo } from "react";
import { VOCABULARY_BREADCRUMBS } from "./breadcrumbs";
import VocabularyContext from "./vocabularyContext";

const VocabularyPage = () => {
  const { vocabulary_id } = useParams() as { vocabulary_id: string };

  const vocabulary = useVocabulary(vocabulary_id);

  useBreadcrumbs(
    useMemo(() => VOCABULARY_BREADCRUMBS(vocabulary.data), [vocabulary.data]),
  );

  const canAdmin = useHasPermission("admin:vocabularies");

  useTabs(
    useMemo(
      () =>
        canAdmin
          ? [
              {
                label: "Items",
                url: `/core/vocabularies/${vocabulary_id}/items`,
              },
              {
                label: "Load sets",
                url: `/core/vocabularies/${vocabulary_id}/load-sets`,
              },
              {
                label: "Settings",
                url: `/core/vocabularies/${vocabulary_id}/settings`,
              },
            ]
          : [],
      [canAdmin, vocabulary_id],
    ),
  );

  if (vocabulary.isLoading) {
    return <LoadingPage />;
  }

  if (vocabulary.isError || !vocabulary.data) {
    return <ErrorPage error={vocabulary.error} />;
  }

  return (
    <VocabularyContext.Provider
      value={{ vocabulary: vocabulary.data, canAdmin }}
    >
      <Outlet />
    </VocabularyContext.Provider>
  );
};

export default VocabularyPage;
