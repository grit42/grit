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
import { Navigate, Route, Routes } from "react-router-dom";

const LazyCompoundsPage = lazy(() => import("./pages/compounds"));

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

const Router = () => {
  return (
    <Routes>
      <Route
        index
        element={
          <AuthGuard>
            <LazyCompoundsPage />
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
        <Route path="batches" element={<LazyCompoundBatchesPage />} />
        <Route path="synonyms" element={<LazyCompoundSynonymsPage />} />
        <Route index path="*" element={<Navigate to="details" replace />} />
      </Route>
    </Routes>
  );
};

export default Router;
