/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/app.
 *
 * @grit42/app is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/app is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/app. If not, see <https://www.gnu.org/licenses/>.
 */

import "./index.scss";

import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";

import { Spinner } from "@grit42/client-library/components";

import CoreMeta from "@grit42/core/meta";
const CoreRouter = lazy(() => import("@grit42/core/router"));

const Router = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path={`${CoreMeta.rootRoute}/*`} element={<CoreRouter />} />
        <Route
          index
          path="*"
          element={<Navigate to="core/entities" replace />}
        />
      </Routes>
    </Suspense>
  );
};

export default Router;
