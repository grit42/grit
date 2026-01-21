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

import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
} from "react-router-dom";
import { Tabs } from "@grit42/client-library/components";
import { useEffect, useState } from "react";
import AssayTypesAdministrationPage from "./assay-types";
import AssayModelsAdministrationPage from "./assay-models";
import AssayMetadataDefinitionsAdministrationPage from "./assay-metadata-definitions";
import ExperimentMetadataTemplatesAdministrationPage from "./experiment-metadata-templates";

const TABS = [
  {
    url: "assay-models",
    label: "Models",
  },
  {
    url: "experiment-metadata-templates",
    label: "Metadata templates",
  },
  {
    url: "assay-metadata-definitions",
    label: "Metadata",
  },
  {
    url: "assay-types",
    label: "Types",
  },
];

const AssaysAdministration = () => {
  const navigate = useNavigate();

  const match = useMatch("/assays/assay-models/settings/:childPath/*");
  const childPath = match?.params.childPath ?? "origins";

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
        Assays administration
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
          alignItems: "center",
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

const AssaysAdministrationTab = () => {
  return (
    <Routes>
      <Route element={<AssaysAdministration />}>
        <Route
          path="/assay-metadata-definitions/*"
          element={<AssayMetadataDefinitionsAdministrationPage />}
        />
        <Route
          path="/experiment-metadata-templates/*"
          element={<ExperimentMetadataTemplatesAdministrationPage />}
        />
        <Route
          path="/assay-types/*"
          element={<AssayTypesAdministrationPage />}
        />
        <Route
          path="/assay-models/*"
          element={<AssayModelsAdministrationPage />}
        />
        <Route path="*" element={<Navigate to={TABS[0].url} replace />} />
      </Route>
    </Routes>
  );
};

export default AssaysAdministrationTab;
