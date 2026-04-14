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

import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { lazy } from "react";
import { AuthGuard, NoAuthGuard } from "../features/auth";
const LazyAuthenticatePage = lazy(() => import("../features/auth/pages/login"));
const LazyTwoFactorAuthenticatePage = lazy(
  () => import("../features/auth/pages/two-factor"),
);
const LazyRequestPasswordResetPage = lazy(
  () => import("../features/auth/pages/password-recovery/request-reset"),
);
const LazyPasswordResetPage = lazy(
  () => import("../features/auth/pages/password-recovery/reset"),
);
const LazyActivatePage = lazy(
  () => import("../features/auth/pages/account-activation"),
);

const LazyEntitiesPage = lazy(() => import("../features/entities/pages"));
const LazyEntityPage = lazy(
  () => import("../features/entities/pages/[entity]"),
);
const LazyEntityDetailsPage = lazy(
  () => import("../features/entities/pages/[entity]/[id]"),
);

const LazyVocabulariesPage = lazy(
  () => import("../features/vocabularies/pages"),
);
const LazyAdministrationPage = lazy(
  () => import("../features/administration/pages"),
);
const LazyAccountPage = lazy(
  () => import("../features/auth/pages/account-settings"),
);
const LazyLoadSetPage = lazy(
  () => import("../features/importer/pages/load_set/[id]"),
);

const Router = () => {
  return (
    <Routes>
      <Route
        path="/authenticate"
        element={
          <NoAuthGuard>
            <LazyAuthenticatePage />
          </NoAuthGuard>
        }
      />
      <Route
        path="/authenticate/:user"
        element={
          <NoAuthGuard>
            <LazyTwoFactorAuthenticatePage />
          </NoAuthGuard>
        }
      />
      <Route
        path="/password_reset"
        element={
          <NoAuthGuard>
            <LazyRequestPasswordResetPage />
          </NoAuthGuard>
        }
      />
      <Route
        path="/password_reset/:token"
        element={
          <NoAuthGuard>
            <LazyPasswordResetPage />
          </NoAuthGuard>
        }
      />
      <Route
        path="/activate/:token"
        element={
          <NoAuthGuard>
            <LazyActivatePage />
          </NoAuthGuard>
        }
      />
      <Route
        path="/entities"
        element={
          <AuthGuard>
            <LazyEntitiesPage />
          </AuthGuard>
        }
      />
      <Route
        path="/entities/:entity"
        element={
          <AuthGuard>
            <LazyEntityPage />
          </AuthGuard>
        }
      />
      <Route
        path="/entities/:entity/:id"
        element={
          <AuthGuard>
            <LazyEntityDetailsPage />
          </AuthGuard>
        }
      />
      <Route
        path="/vocabularies"
        element={
          <AuthGuard>
            <Outlet />
          </AuthGuard>
        }
      >
        <Route index path="*" element={<LazyVocabulariesPage />} />
      </Route>
      <Route
        path="/administration"
        element={
          <AuthGuard roles={["Administrator"]}>
            <Outlet />
          </AuthGuard>
        }
      >
        <Route index path="*" element={<LazyAdministrationPage />} />
      </Route>
      <Route
        path="/account"
        element={
          <AuthGuard>
            <LazyAccountPage />
          </AuthGuard>
        }
      />
      <Route
        path="/load_sets/:id/*"
        element={
          <AuthGuard>
            <LazyLoadSetPage />
          </AuthGuard>
        }
      />
      <Route index path="*" element={<Navigate to="/core/vocabularies" />} />
    </Routes>
  );
};

export default Router;
