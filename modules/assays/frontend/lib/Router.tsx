/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { AuthGuard } from "@grit42/core";
import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
const LazyAssayModelsPage = lazy(() => import("./pages/assay-models"));
const LazyExperimentsPage = lazy(() => import("./pages/experiments"));
const LazyDataTablesPage = lazy(() => import("./features/data-tables/pages"));
const LazyAssaySettingsPage = lazy(() => import("./pages/assays/settings"));

const Router = () => {
  return (
    <Routes>
      <Route path="assay-models/*">
        <Route
          path="settings/*"
          element={
            <AuthGuard>
              <LazyAssaySettingsPage />
            </AuthGuard>
          }
        />
        <Route
          path="*"
          element={
            <AuthGuard>
              <LazyAssayModelsPage />
            </AuthGuard>
          }
        ></Route>
      </Route>
      <Route
        path="experiments/*"
        element={
          <AuthGuard>
            <LazyExperimentsPage />
          </AuthGuard>
        }
      />
      <Route
        path="data_tables/*"
        element={
          <AuthGuard>
            <LazyDataTablesPage />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="experiments" replace />} />
    </Routes>
  );
};

export default Router;
