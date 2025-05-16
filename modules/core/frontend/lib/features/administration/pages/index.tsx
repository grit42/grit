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
import {
  useAdministrationTabs,
} from "../AdministrationContext";
import styles from "./administration.module.scss"

const AdministrationTabs = () => {
  const navigate = useNavigate();
  const match = useMatch("core/administration/:childPath/*");
  const tabs = useAdministrationTabs();
  const childPath = match?.params.childPath;

  const [selectedTab, setSelectedTab] = useState(
    tabs.findIndex(({ id }) => childPath === id),
  );

  useEffect(() => {
    setSelectedTab(tabs.findIndex(({ id }) => childPath === id));
  }, [childPath, tabs]);

  const handleTabChange = (index: number) => {
    navigate(tabs[index].id);
  };

  return (
    <div
      className={styles.administrationPage}
    >
      <Tabs
        onTabChange={handleTabChange}
        selectedTab={selectedTab}
        tabs={tabs.map((t) => ({
          key: t.id,
          name: t.label,
          panel: <></>,
        }))}
      />
      <Outlet />
    </div>
  );
};

const AdministrationPage = () => {
  const tabs = useAdministrationTabs();

  return (
    <Routes>
      <Route element={<AdministrationTabs />}>
        {tabs.map((t) => (
          <Route key={t.id} path={`${t.id}/*`} element={<t.Tab />} />
        ))}
        <Route path="*" element={<Navigate to={tabs[0].id} />} />
      </Route>
    </Routes>
  );
};

export default AdministrationPage;
