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

import { Navigate, Route, Routes } from "react-router-dom";
import { useBreadcrumbs, useTabs } from "../../app";
import { useEffect } from "react";
import UsersPage from "./users";
import UserPage from "./users/user/UserPage";
import NewUserPage from "./users/user/NewUserPage";
import RolesPage from "./roles";
import RolePage from "./roles/role/RolePage";
import NewRolePage from "./roles/role/NewRolePage";

const TABS = [
  {
    url: "/core/user-administration/users",
    label: "Users",
  },
  {
    url: "/core/user-administration/roles",
    label: "Roles",
  },
];

const BREADCRUMBS = [
  { label: "User administration", url: "/core/user-administration" },
];

const UserAdministrationPage = () => {
  const { register: registerBreadcrumbs } = useBreadcrumbs();
  const { register: registerTabs } = useTabs();

  useEffect(() => {
    const unregisterBreadcrumbs = registerBreadcrumbs(BREADCRUMBS);
    const unregisterTabs = registerTabs(TABS);
    return () => {
      unregisterBreadcrumbs();
      unregisterTabs();
    };
  }, [registerBreadcrumbs, registerTabs]);

  return (
    <Routes>
      <Route path="users">
        <Route index element={<UsersPage />} />
        <Route path="new" element={<NewUserPage />} />
        <Route path=":user_id" element={<UserPage />} />
      </Route>
      <Route path="roles">
        <Route index element={<RolesPage />} />
        <Route path="new" element={<NewRolePage />} />
        <Route path=":role_id" element={<RolePage />} />
      </Route>
      <Route index element={<Navigate to="users" replace />} />
    </Routes>
  );
};

export default UserAdministrationPage;
