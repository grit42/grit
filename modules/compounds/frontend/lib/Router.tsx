/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { AuthGuard } from "@grit42/core";
import { lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import NewBatchPage from "./pages/compounds/[id]/batches/NewBatchPage";
import BatchPage from "./pages/compounds/[id]/batches/BatchPage";
import NewSynonymPage from "./pages/compounds/[id]/synonyms/NewSynonymPage";
import SynonymPage from "./pages/compounds/[id]/synonyms/SynonymPage";

const LazyCompoundsPage = lazy(() => import("./pages/compounds"));
const LazyNewCompoundPage = lazy(
  () => import("./pages/compounds/NewCompoundPage"),
);

const LazyCompoundPage = lazy(() => import("./pages/compounds/[id]"));
const LazyCompoundDetailsPage = lazy(
  () => import("./pages/compounds/[id]/details"),
);
const LazyCompoundBatchesPage = lazy(
  () => import("./pages/compounds/[id]/batches"),
);
const LazyCompoundSynonymsPage = lazy(
  () => import("./pages/compounds/[id]/synonyms"),
);
const LazyCompoundSettingsPage = lazy(
  () => import("./pages/compounds/settings"),
);

const Router = () => {
  return (
    <Routes>
      <Route
        element={
          <AuthGuard permission="read:system">
            <Outlet />
          </AuthGuard>
        }
      >
        <Route
          index
          element={
            <AuthGuard>
              <LazyCompoundsPage />
            </AuthGuard>
          }
        />
        <Route
          path="new"
          element={
            <AuthGuard>
              <LazyNewCompoundPage />
            </AuthGuard>
          }
        />

        <Route
          path=":id"
          element={
            <AuthGuard>
              <LazyCompoundPage />
            </AuthGuard>
          }
        >
          <Route path="details" element={<LazyCompoundDetailsPage />} />
          <Route path="batches">
            <Route index element={<LazyCompoundBatchesPage />} />
            <Route path="new" element={<NewBatchPage />} />
            <Route path=":batch_id" element={<BatchPage />} />
          </Route>
          <Route path="synonyms">
            <Route index  element={<LazyCompoundSynonymsPage />} />
            <Route path="new" element={<NewSynonymPage />} />
            <Route path=":synonym_id" element={<SynonymPage />} />
          </Route>
          <Route
            index
            path="*"
            element={<Navigate to="../details" replace />}
          />
        </Route>

        <Route
          path="settings"
          element={
            <AuthGuard permission="admin:compounds">
              <Outlet />
            </AuthGuard>
          }
        >
          <Route index path="*" element={<LazyCompoundSettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default Router;
