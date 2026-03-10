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

import { RoutedTabs } from "@grit42/client-library/components";
import { Navigate, Route, Routes } from "react-router-dom";
import UserAdministrationTab from "./users";
import RoleAdministrationTab from "./roles";
import { PageLayout } from "@grit42/client-library/layouts";

const TABS = [
  {
    url: "users",
    label: "Users",
  },
  {
    url: "roles",
    label: "Roles",
  },
];

const AccessAdministration = () => {
  return (
    <RoutedTabs
      matchPattern="/core/administration/user-management/:childPath/*"
      tabs={TABS}
    />
  );
};

const AccessAdministrationTab = () => {
  return (
    <PageLayout>
      <Routes>
        <Route element={<AccessAdministration />}>
          <Route path="users">
            <Route index path="*" element={<UserAdministrationTab />} />
          </Route>
          <Route path="roles">
            <Route index path="*" element={<RoleAdministrationTab />} />
          </Route>
          <Route index path="*" element={<Navigate to="../users" replace />} />
        </Route>
      </Routes>
    </PageLayout>
  );
};

export default AccessAdministrationTab;
