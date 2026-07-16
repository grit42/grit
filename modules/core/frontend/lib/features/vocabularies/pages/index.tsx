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

import { Route, Routes } from "react-router-dom";
import { AuthGuard } from "../../auth";
import VocabulariesPage from "./VocabulariesPage";
import NewVocabularyPage from "./NewVocabularyPage";
import VocabularyPage from "./vocabulary/VocabularyPage";
import VocabularyItemsPage from "./vocabulary/VocabularyItemsPage";
import NewVocabularyItemPage from "./vocabulary/vocabulary-item/NewVocabularyItemPage";
import VocabularyItemPage from "./vocabulary/vocabulary-item/VocabularyItemPage";
import VocabularyLoadSetsPage from "./vocabulary/VocabularyLoadSetsPage";
import VocabularySettingsPage from "./vocabulary/VocabularySettingsPage";

const VocabulariesRoutes = () => {
  return (
    <Routes>
      <Route index element={<VocabulariesPage />} />
      <Route path="new" element={<NewVocabularyPage />} />
      <Route path=":vocabulary_id" element={<VocabularyPage />}>
        <Route path="items">
          <Route
            index
            element={<VocabularyItemsPage />}
          />
          <Route path="new" element={<NewVocabularyItemPage />} />
          <Route path=":vocabulary_item_id" element={<VocabularyItemPage />} />
        </Route>
        <Route
          path="load-sets"
          element={
            <AuthGuard permission="admin:vocabularies">
              <VocabularyLoadSetsPage />
            </AuthGuard>
          }
        />
        <Route
          path="settings"
          element={
            <AuthGuard permission="admin:vocabularies">
              <VocabularySettingsPage />
            </AuthGuard>
          }
        />
      </Route>
    </Routes>
  );
};

export default VocabulariesRoutes;
