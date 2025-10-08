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

import { Tabs } from "@grit42/client-library/components";
import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
} from "react-router-dom";
import UserAdministrationTab from "./tabs/users";
import RoleAdministrationTab from "./tabs/roles";

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
  const navigate = useNavigate();

  const match = useMatch("/core/administration/user-management/:childPath/*");
  const childPath = match?.params.childPath ?? "users";

  const [selectedTab, setSelectedTab] = useState(
    TABS.findIndex(({ url }) => childPath === url),
  );

  useEffect(() => {
    setSelectedTab(TABS.findIndex(({ url }) => childPath === url));
  }, [childPath]);

  const handleTabChange = (index: number) => {
    navigate(TABS[index].url);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "min-content 1fr",
        height: "100%",
      }}
    >
      <Tabs
        onTabChange={handleTabChange}
        selectedTab={selectedTab}
        tabs={TABS.map((t) => ({
          key: t.url,
          name: t.label,
          panel: <></>,
        }))}
      />
      <Outlet />
    </div>
  );
};

const AccessAdministrationTab = () => {
  return (
    <div style={{height: "100%", width: "100%", overflow: "auto"}}>
      <Routes>
        <Route element={<AccessAdministration />}>
          <Route path="users/*" element={<UserAdministrationTab />} />
          <Route path="roles/*" element={<RoleAdministrationTab />} />
          <Route index element={<Navigate to="users" replace />} />
        </Route>
      </Routes>
    </div>
  );
};

export default AccessAdministrationTab;
