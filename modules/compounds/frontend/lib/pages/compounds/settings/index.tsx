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

import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
} from "react-router-dom";
import CompoundTypeManager from "./compound-type-manager";
import CompoundBatchLoadSets from "./load-sets/CompoundBatchLoadSets";
import { useEffect, useState } from "react";
import { Tabs } from "@grit42/client-library/components";

const TABS = [
  {
    url: "metadata",
    label: "Metadata",
  },
  {
    url: "load-sets",
    label: "Load sets",
  },
];
const CompoundAdministration = () => {
  const navigate = useNavigate();

  const match = useMatch("/compounds/settings/:childPath/*");
  const childPath = match?.params.childPath ?? "metadata";
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
        gridTemplateRows: "min-content min-content 1fr",
        height: "100%",
        overflow: "auto",
      }}
    >
      <h2
        style={{
          paddingBottom: "var(--spacing)",
          color: "var(--palette-secondary-main)",
        }}
      >
        Compounds administration
      </h2>
      <Tabs
        onTabChange={handleTabChange}
        selectedTab={selectedTab}
        tabs={TABS.map((t) => ({
          key: t.url,
          name: t.label,
          panel: <></>,
        }))}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

const CompoundAdministrationTab = () => {
  return (
    <Routes>
      <Route element={<CompoundAdministration />}>
        <Route path="/metadata" element={<CompoundTypeManager />} />
        <Route path="/load-sets/*" element={<CompoundBatchLoadSets />} />
        <Route path="*" element={<Navigate to="metadata" />} />
      </Route>
    </Routes>
  );
};

export default CompoundAdministrationTab;
